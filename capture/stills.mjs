#!/usr/bin/env node
/**
 * The look loop's camera. One bundle, one browser, sequential.
 *
 *   node capture/stills.mjs --comp Tamaiti-60-Landscape --at 0,2.4,7.9     ad-hoc seconds
 *   node capture/stills.mjs --comp Tamaiti-60-Landscape --every 2         contact frames
 *   node capture/stills.mjs --comp Tamaiti-60-Landscape --handovers       -0.2 / +0.1 / +0.4 s around every cut
 *
 * Frames land in out/stills/<comp>/ named by contiguous index with the second
 * as a suffix (an image-sequence reader stops at the first gap in an index).
 * Tiling is a separate process: capture/tile-contact.mjs.
 */
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import { mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const argv = process.argv.slice(2);
const opt = (name, dflt) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : dflt; };
const comps = (opt("--comp") ?? "").split(",").filter(Boolean);
if (!comps.length) { console.error("stills: --comp <id>[,<id>] is required"); process.exit(1); }
const scale = Number(opt("--scale", "1"));
const FPS = 30;

const bundleDir = resolve("out/bundle");
const serveUrl = argv.includes("--reuse") && existsSync(join(bundleDir, "index.html"))
  ? bundleDir
  : await bundle({ entryPoint: resolve("src/index.ts"), outDir: bundleDir });
const browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" } });

let shot = 0;
for (const id of comps) {
  const composition = await selectComposition({ serveUrl, id, puppeteerInstance: browser });
  const total = composition.durationInFrames / FPS;
  let seconds;
  if (opt("--at")) seconds = opt("--at").split(",").map(Number);
  else if (argv.includes("--handovers")) {
    // the cut points of this composition's own timeline, read from the committed EDL summary
    const cut = /-(\d+)-/.exec(id)?.[1];
    const tl = JSON.parse(readFileSync("out/timeline.json", "utf8"))[cut];
    seconds = tl.boundaries.flatMap((b) => [b - 0.2, b + 0.1, b + 0.4]).filter((s) => s >= 0 && s < total);
  } else {
    const every = Number(opt("--every", "1"));
    seconds = Array.from({ length: Math.ceil(total / every) }, (_, i) => i * every);
  }
  const dir = resolve(opt("--out", join("out/stills", id + (argv.includes("--handovers") ? "-handover" : ""))));
  if (!opt("--at")) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const [i, sec] of seconds.entries()) {
    const frame = Math.min(composition.durationInFrames - 1, Math.max(0, Math.round(sec * FPS)));
    const name = opt("--at") ? `at-${sec.toFixed(2)}s.png` : `${String(i).padStart(3, "0")}-${sec.toFixed(2)}s.png`;
    await renderStill({ composition, serveUrl, output: join(dir, name), frame, imageFormat: "png", scale, puppeteerInstance: browser, chromiumOptions: { gl: "angle" } });
    shot++;
  }
  console.log(`stills: ${id} — ${seconds.length} frame(s) -> ${dir}`);
}
await browser.close({ silent: true });
if (shot === 0) { console.error("stills: VACUOUS — shot nothing"); process.exit(1); }
