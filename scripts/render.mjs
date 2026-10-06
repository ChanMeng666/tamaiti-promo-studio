#!/usr/bin/env node
/**
 * Render the masters: gates first, one bundle, one composition at a time.
 *
 *   node scripts/render.mjs                 all six
 *   node scripts/render.mjs --only 60       one length, both aspects
 *   node scripts/render.mjs --only 60l      one master (l = landscape, v = vertical)
 *   node scripts/render.mjs --skip-gates    (look-loop renders only; never for a release)
 *
 * Per master:
 *   1. remotion render  -> out/raw/<file>          picture + the composition's own mix
 *   2. ffmpeg loudnorm  -> out/masters/<file>      two passes, linear, to -16 LUFS / -1.5 dBTP;
 *                                                  the picture stream is copied, not re-encoded
 *   3. measure the DELIVERED file and write out/masters/MANIFEST.json
 */
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { totalmem } from "node:os";
import { join, resolve } from "node:path";

const argv = process.argv.slice(2);
const only = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : "all";
const TARGET = { lufs: -16, tp: -1.5, lra: 11 };

const CUTS = ["15", "30", "60"];
const SHAPES = [["l", "Landscape", "landscape", "1920x1080"], ["v", "Vertical", "vertical", "1080x1920"]];
const targets = CUTS.flatMap((cut) => SHAPES.map(([tag, idPart, namePart, size]) => ({
  tag: cut + tag, cut, comp: `Tamaiti-${cut}-${idPart}`, file: `tam-ai-ti_${cut}s_${namePart}_${size}.mp4`,
}))).filter((t) => only === "all" || t.cut === only || t.tag === only);
if (!targets.length) { console.error(`render: nothing matches --only ${only}`); process.exit(1); }

const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32", ...opts });
  if (r.status !== 0) { console.error(`render: ${cmd} ${args.slice(0, 3).join(" ")} … exited ${r.status}`); process.exit(1); }
};
const ff = (args) => spawnSync("ffmpeg", ["-hide_banner", "-nostdin", ...args], { encoding: "utf8" });

if (!argv.includes("--skip-gates")) run("node", ["capture/verify.mjs"]);

mkdirSync("out/raw", { recursive: true });
mkdirSync("out/masters", { recursive: true });
console.log("\nbundling once …");
run("npx", ["remotion", "bundle", "src/index.ts", "--out-dir", "out/bundle", "--log=error"]);

// 16 GB machines render one browser tab at a time per composition comfortably at 4
const concurrency = argv.includes("--concurrency") ? argv[argv.indexOf("--concurrency") + 1] : totalmem() < 24e9 ? "4" : "8";

const measure = (file) => {
  const r = ff(["-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"]);
  const tail = r.stderr.slice(r.stderr.lastIndexOf("Summary:"));
  const num = (re) => Number((re.exec(tail) ?? [])[1]);
  return { lufs: num(/I:\s+(-?[\d.]+) LUFS/), lra: num(/LRA:\s+(-?[\d.]+) LU/), truePeak: num(/Peak:\s+(-?[\d.]+) dBFS/) };
};
const probe = (file) => JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_name,width,height,nb_frames,r_frame_rate", "-of", "json", file], { encoding: "utf8" }));

const manifestPath = "out/masters/MANIFEST.json";
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : { masters: {} };
const commit = (() => { try { return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { return "uncommitted"; } })();
const product = JSON.parse(readFileSync("src/replica/data/product.generated.json", "utf8")).source.commit;

for (const t of targets) {
  const raw = join("out/raw", t.file);
  const out = join("out/masters", t.file);
  console.log(`\n── ${t.comp} ─────────────────────────────────`);
  const started = Date.now();
  run("npx", ["remotion", "render", "out/bundle", t.comp, raw, "--codec=h264", "--crf=19", "--pixel-format=yuv420p", "--audio-codec=aac", "--audio-bitrate=320k", `--concurrency=${concurrency}`, "--log=error"]);

  // pass 1: measure. pass 2: apply the measured values, linear, so loudnorm cannot fall into dynamic mode
  const p1 = ff(["-i", raw, "-vn", "-af", `loudnorm=I=${TARGET.lufs}:TP=${TARGET.tp}:LRA=${TARGET.lra}:print_format=json`, "-f", "null", "-"]);
  const j = JSON.parse(p1.stderr.slice(p1.stderr.lastIndexOf("{"), p1.stderr.lastIndexOf("}") + 1));
  const af = `loudnorm=I=${TARGET.lufs}:TP=${TARGET.tp}:LRA=${TARGET.lra}:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
  const p2 = ff(["-y", "-i", raw, "-c:v", "copy", "-af", af, "-ar", "48000", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", out]);
  if (p2.status !== 0) { console.error(p2.stderr.slice(-600)); process.exit(1); }

  const loud = measure(out);
  const info = probe(out);
  const v = info.streams.find((s) => s.codec_name === "h264");
  const a = info.streams.find((s) => s.codec_name === "aac");
  const problems = [];
  if (!a) problems.push("NO AUDIO STREAM");
  if (!(Math.abs(loud.lufs - TARGET.lufs) <= 0.7)) problems.push(`loudness ${loud.lufs} LUFS is outside ${TARGET.lufs} ± 0.7`);
  if (!(loud.truePeak <= TARGET.tp + 0.3)) problems.push(`true peak ${loud.truePeak} dBTP is over ${TARGET.tp}`);
  if (Number(v?.nb_frames) !== Number(t.cut) * 30) problems.push(`${v?.nb_frames} frames, expected ${Number(t.cut) * 30}`);
  manifest.masters[t.file] = {
    composition: t.comp, bytes: statSync(out).size, sha256: createHash("sha256").update(readFileSync(out)).digest("hex"),
    width: v?.width, height: v?.height, frames: Number(v?.nb_frames), durationSec: Number(Number(info.format.duration).toFixed(3)),
    loudnessLufs: loud.lufs, truePeakDbtp: loud.truePeak, loudnessRangeLu: loud.lra,
    renderedAt: new Date(statSync(out).mtimeMs).toISOString(), filmCommit: commit, productCommit: product, problems,
  };
  writeFileSync(manifestPath, JSON.stringify({ target: TARGET, ...manifest }, null, 2) + "\n");
  console.log(`   ${out}`);
  console.log(`   ${(statSync(out).size / 1e6).toFixed(1)} MB · ${v?.width}x${v?.height} · ${v?.nb_frames} frames · ${loud.lufs} LUFS · ${loud.truePeak} dBTP · rendered in ${((Date.now() - started) / 1000).toFixed(0)}s`);
  for (const p of problems) console.error(`   ✗ ${p}`);
  if (problems.length) process.exitCode = 1;
}
console.log(`\nwrote ${resolve(manifestPath)}`);
