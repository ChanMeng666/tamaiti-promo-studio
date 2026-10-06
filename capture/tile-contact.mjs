#!/usr/bin/env node
/** Tile whatever stills are on disk into one contact sheet per folder. Separate process on purpose. */
import { execFileSync } from "node:child_process";
import { readdirSync, mkdtempSync, copyFileSync, statSync, existsSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { tmpdir } from "node:os";

const root = resolve("out/stills");
const only = process.argv[2];
const cell = Number(process.argv[3] ?? 480);
let made = 0;
for (const d of existsSync(root) ? readdirSync(root) : []) {
  const dir = join(root, d);
  if (!statSync(dir).isDirectory() || (only && !d.includes(only))) continue;
  const files = readdirSync(dir).filter((f) => /^\d{3}-.*\.png$/.test(f)).sort();
  if (!files.length) continue;
  const tmp = mkdtempSync(join(tmpdir(), "sheet-"));
  files.forEach((f, i) => copyFileSync(join(dir, f), join(tmp, String(i).padStart(3, "0") + ".png")));
  const portrait = d.includes("Vertical") || d.includes("mobile");
  const cols = Math.min(files.length, portrait ? 8 : 5);
  const rows = Math.ceil(files.length / cols);
  const out = join(root, `sheet-${basename(dir)}.png`);
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", join(tmp, "%03d.png"), "-vf", `scale=${portrait ? Math.round(cell * 0.5) : cell}:-1,tile=${cols}x${rows}:margin=6:padding=4:color=0x222222`, "-frames:v", "1", out]);
  console.log(`sheet: ${out} (${files.length} frames, ${cols}x${rows})`);
  made++;
}
if (!made) { console.error("sheet: nothing to tile"); process.exit(1); }
