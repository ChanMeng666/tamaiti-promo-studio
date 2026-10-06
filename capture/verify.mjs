#!/usr/bin/env node
/**
 * The gate suite. Every gate executes the film's OWN modules (bundled with
 * esbuild and run in Node), prints how many things it looked at, and treats
 * zero as a failure.
 *
 *   node capture/verify.mjs [--product ../tam-ai-ti-web]
 */
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const argv = process.argv.slice(2);
const PRODUCT = resolve(argv.includes("--product") ? argv[argv.indexOf("--product") + 1] : "../tam-ai-ti-web");
let red = 0;
const report = (name, count, fails, note = "") => {
  for (const f of fails) console.error("    ✗ " + f);
  if (count === 0) { console.error("  " + name + ": VACUOUS — looked at 0 things"); red++; return; }
  console.log("  " + name + ": " + (fails.length ? "FAIL" : "ok") + " — " + count + " checked" + (note ? " (" + note + ")" : "") + ", " + fails.length + " failing");
  if (fails.length) red++;
};
const finite = (v, what) => { if (!Number.isFinite(v)) throw new Error(what + " is not finite (" + v + ")"); return v; };

// the React-free core, as the renderer runs it
const entry = [
  'export * as layout from "./core/layout-core";',
  'export * as timeline from "./core/timeline";',
  'export * as cues from "./cues";',
  'export * as copy from "./copy";',
  'export * as scenes from "./scenes";',
  'export * as plays from "./replica/screenplays";',
  'export * as demo from "./replica/demo";',
  'export { default as music } from "./data/music.json";',
  'export { default as sfx } from "./data/sfx.json";',
  'export { default as product } from "./replica/data/product.generated.json";',
].join("\n");
const b = await build({
  stdin: { contents: entry, resolveDir: resolve("src"), sourcefile: "gate-entry.ts", loader: "ts" },
  bundle: true, write: false, format: "esm", platform: "node", loader: { ".json": "json" }, logLevel: "silent",
});
const m = await import("data:text/javascript;base64," + Buffer.from(b.outputFiles[0].text).toString("base64"));
const FPS = m.layout.FPS;
const walk = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const SRC = walk("src").filter((p) => /\.(ts|tsx)$/.test(p));
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

console.log("gates:");

// 1 ── bake: the committed product data is what the product repo says today
try {
  execFileSync("node", ["scripts/bake-product-data.mjs", "--check", "--product", PRODUCT], { stdio: "pipe" });
  report("bake", m.product.source.files.length, [], "product commit " + m.product.source.commit.slice(0, 7));
} catch (e) { report("bake", 1, [String(e.stderr || e.message).trim()]); }

// 2 ── strings: every replica string is the product's (it prints its own count)
try { console.log("  " + execFileSync("node", ["capture/check-strings.mjs", PRODUCT], { encoding: "utf8" }).trim()); }
catch (e) { console.error(String(e.stderr || "") + String(e.stdout || "")); red++; }

// 3 ── assets: every file the film names exists
{
  const fails = []; let n = 0;
  const need = [
    ...Object.values(m.music.beds).map((x) => x.file), ...Object.values(m.sfx.files).map((x) => x.file),
    ...["night", "dawn"].flatMap((t) => ["sky", "far", "mid", "sea", "glints", "near"].map((l) => "art/" + t + "/" + l + ".webp")),
    "art/moon.webp", "art/sun.webp",
  ];
  for (const f of need) { n++; if (!existsSync(join("public", f))) fails.push("missing public/" + f); }
  for (const s of Object.values(m.scenes.SCENES)) { n++; if (!existsSync("public/art/wash/" + s.wash + ".webp")) fails.push("scene " + s.id + ": no wash " + s.wash); }
  report("assets", n, fails);
}

// 4 ── timeline: frame counts exact, windows legal, no frame arithmetic outside core/timeline.ts
{
  const fails = []; let n = 0; const dump = {};
  for (const cut of m.layout.CUT_IDS) {
    const tl = m.timeline.timelineFor(cut);
    n++; fails.push(...tl.problems);
    const frames = tl.beats.reduce((a, x) => a + x.durationInFrames, 0);
    if (frames !== m.layout.CUT_SECONDS[cut] * FPS) fails.push("cut " + cut + ": " + frames + " frames, expected " + m.layout.CUT_SECONDS[cut] * FPS);
    for (const beat of tl.beats) {
      n++;
      finite(beat.rate, "cut " + cut + " beat " + beat.index + " rate");
      const id = "cut " + cut + " " + beat.scene.id;
      if (beat.durationSec < 0.5) fails.push(id + ": " + beat.durationSec + "s is a flash, not a shot");
      if (beat.from < 0 || beat.to > beat.scene.durationSec + 1e-6 || beat.to <= beat.from) fails.push(id + ": window " + beat.from + "–" + beat.to + " is outside its " + beat.scene.durationSec + "s screenplay");
      if (beat.scene.kind === "screen" && beat.rate > 1.45) fails.push(id + ": replica runs at " + beat.rate.toFixed(2) + "x — too fast to follow");
    }
    dump[cut] = {
      totalSec: tl.totalSec, boundaries: tl.beats.slice(1).map((x) => x.startSec),
      beats: tl.beats.map((x) => ({ scene: x.scene.id, startSec: x.startSec, sec: x.durationSec, from: x.from, to: x.to, rate: +x.rate.toFixed(3) })),
    };
  }
  for (const p of SRC) {
    if (p.replace(/\\/g, "/").endsWith("core/timeline.ts")) continue;
    const text = strip(readFileSync(p, "utf8")); n++;
    const hit = /(durationInFrames|from|frame)\s*=\s*\{\s*\d+\s*\}/.exec(text) || /[*/]\s*FPS\b/.exec(text);
    if (hit) fails.push(p + ": frame arithmetic outside core/timeline.ts → " + hit[0]);
  }
  mkdirSync("out", { recursive: true });
  writeFileSync("out/timeline.json", JSON.stringify(dump, null, 2) + "\n");
  report("timeline", n, fails, "wrote out/timeline.json");
}

// 5 ── bars: every cut boundary sits on a bar line of that cut's own bed
{
  const fails = []; let n = 0;
  for (const cut of m.layout.CUT_IDS) {
    const bed = m.music.beds[cut];
    if (bed.durationSec !== m.layout.CUT_SECONDS[cut]) fails.push("bed " + cut + ": " + bed.durationSec + "s");
    const beats = m.timeline.timelineFor(cut).beats;
    for (const beat of beats.slice(1)) {
      n++;
      const off = Math.min(...bed.downbeats.map((d) => Math.abs(d - beat.startSec)));
      if (finite(off, "bar offset") > 1 / FPS) fails.push("cut " + cut + ": " + beat.scene.id + " starts " + off.toFixed(3) + "s off a bar line");
    }
    const end = bed.sections.find((s) => s.name === "end");
    n++;
    if (!end || Math.abs(end.startSec - beats.at(-1).startSec) > 1 / FPS) fails.push("cut " + cut + ": end card at " + beats.at(-1).startSec + "s, cadence at " + (end && end.startSec) + "s");
  }
  report("bars", n, fails);
}

// 6 ── copy: every film-voice line is cleared, reads in its time, and makes no banned claim
{
  const fails = []; let n = 0;
  const clearance = existsSync("docs/copy-clearance.md") ? readFileSync("docs/copy-clearance.md", "utf8") : null;
  if (!clearance) fails.push("docs/copy-clearance.md is missing — a missing table clears nothing");
  const BANNED = [/\b(fastest|instant(ly)?|in seconds|guarantee[ds]?|risk[- ]free)\b/i, /\b(financial advice|adviser|advisor)\b/i, /\$\s?\d/, /\b(best|number one)\b/i];
  for (const text of new Set(m.copy.allCopy())) {
    n++;
    if (clearance && !clearance.includes(text)) fails.push("uncleared: " + JSON.stringify(text));
    for (const re of BANNED) if (re.test(text)) fails.push("banned claim " + re + " in " + JSON.stringify(text));
  }
  for (const cut of m.layout.CUT_IDS) for (const beat of m.timeline.timelineFor(cut).beats) {
    const c = beat.scene.copy; if (!c) continue; n++;
    const words = c.lines.landscape.join(" ").split(/\s+/).length;
    const need = Math.max(0.9, words * 0.24);
    if (beat.durationSec < need) fails.push("cut " + cut + " " + beat.scene.id + ": " + words + " words need " + need.toFixed(1) + "s, has " + beat.durationSec + "s");
  }
  report("copy", n, fails);
}

// 7 ── numbers: the demo persona's figures are consistent with each other and with the product's data
{
  const fails = []; let n = 0; const D = m.demo.DEMO; const g = D.goal;
  const check = (ok, msg) => { n++; if (!ok) fails.push(msg); };
  check(g.baseline < g.current && g.current + g.deposit <= g.target, "goal: baseline < current, and the deposit does not overshoot the target");
  check(g.history[0] === g.baseline && g.history.at(-1) === g.current, "goal: the chart's history starts at the baseline and ends at the current figure");
  check(g.history.every((v, i) => i === 0 || v >= g.history[i - 1]), "goal: history is non-decreasing");
  const day = m.product.maramataka.days.find((d) => d.date === D.today.iso);
  check(!!day, "demo today " + D.today.iso + " is a real date in the product's lunar table");
  check(day && day.isFullMoon && day.name === "Te Rākaunui", "demo today is the full moon the dialog's badge names");
  check(day && day.dayOfMonth === D.today.dayOfMonth, "demo today's day-of-month matches the baked calendar");
  check(new Date(D.today.iso + "T12:00:00").toLocaleDateString("en-NZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) === D.today.label, "demo today's label is that date, formatted as the product formats it");
  check(D.supporters.length === D.support.stats.network, "support: the network count equals the supporters listed");
  check(m.product.maramataka.days.length === 30 && Object.keys(m.product.maramataka.moons).length === 30, "30 lunar days and 30 moon phases baked");
  check(m.product.goalTypes.some((t) => t.code === g.typeCode), "the demo goal's type is one of the product's goal types");
  report("numbers", n, fails);
}

// 8 ── audio: the cue sheet is derived, in range, and not a wall of sound
{
  const fails = []; let n = 0; const sheets = [];
  for (const cut of m.layout.CUT_IDS) {
    const cues = m.cues.cuesFor(cut); const total = m.layout.CUT_SECONDS[cut];
    sheets.push(cut + "s: " + cues.length + " cues");
    if (!cues.length) fails.push("cut " + cut + ": no cues");
    for (const c of cues) {
      n++;
      if (!existsSync(join("public", c.file))) fails.push("cut " + cut + ": " + c.file + " missing");
      if (finite(c.startSec, "cue start") < 0 || c.atSec > total) fails.push("cut " + cut + ": " + c.role + " at " + c.atSec.toFixed(2) + "s is outside the cut");
    }
    for (let t = 0; t < total; t += 0.05) {
      const live = cues.filter((c) => c.startSec <= t && c.startSec + c.durationSec > t).length;
      if (live > 4) { fails.push("cut " + cut + ": " + live + " cues sounding at " + t.toFixed(2) + "s"); break; }
    }
    const ducked = Array.from({ length: total * 20 }, (_, i) => m.cues.duckDbAt(i / 20, cues)).filter((d) => d < -0.5).length / (total * 20);
    n++; if (ducked > 0.3) fails.push("cut " + cut + ": the bed is ducked " + (ducked * 100).toFixed(0) + "% of the time — that is a trim, not a duck");
    n++; if (cues.filter((c) => c.role === "end").length !== 1) fails.push("cut " + cut + ": expected exactly one end cue");
  }
  if (!m.music.provenance.commercialUse || !m.sfx.provenance.commercialUse) fails.push("an audio asset is not cleared for commercial use");
  report("audio", n, fails, sheets.join(", "));
}

// 9 ── purity: nothing in the picture runs on the wall clock
{
  const fails = []; let n = 0;
  const BANS = [
    [/\btransition\s*:/, "a CSS transition"], [/\banimation\s*:/, "a CSS animation"], [/@keyframes/, "@keyframes"], [/will-?change/i, "will-change"],
    [/Date\.now|performance\.now|new Date\(|Math\.random|requestAnimationFrame/, "a clock or randomness"], [/\buse(State|Effect|Ref|LayoutEffect)\b/, "a stateful hook"],
  ];
  for (const p of SRC) {
    const text = strip(readFileSync(p, "utf8")); n++;
    for (const [re, what] of BANS) if (re.test(text)) fails.push(p + ": " + what);
  }
  report("purity", n, fails);
}

// 10 ── honesty: every cut finishes on the end card, and the disclosure is up long enough to read
{
  const fails = []; let n = 0;
  for (const cut of m.layout.CUT_IDS) {
    const end = m.timeline.timelineFor(cut).beats.at(-1); n++;
    if (end.scene.kind !== "end") fails.push("cut " + cut + ": does not finish on the end card");
    if (end.durationSec < 2.5) fails.push("cut " + cut + ": disclosure visible " + end.durationSec + "s, floor is 2.5s");
  }
  report("honesty", n, fails);
}

console.log(red ? "\n" + red + " gate(s) RED" : "\nall gates green");
process.exit(red ? 1 : 0);
