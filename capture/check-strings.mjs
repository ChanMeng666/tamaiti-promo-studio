// Gate: every replica string is the product's own. Bundles src/replica/strings.ts
// and (1) resolves each tr() key against the baked i18n, (2) reads the product
// file each hard-coded string names and asserts the literal occurs in it.
import { build } from "esbuild";
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const PRODUCT = resolve(process.argv[2] ?? "../tam-ai-ti-web");
const b = await build({ entryPoints: ["src/replica/strings.ts"], bundle: true, write: false, format: "esm", platform: "node", loader: { ".json": "json" }, logLevel: "silent" });
const m = await import("data:text/javascript;base64," + Buffer.from(b.outputFiles[0].text).toString("base64"));
const fails = [];
let n = 0;
for (const key of m.TR_KEYS) for (const lang of ["mi", "en"]) {
  n++;
  const v = m.tr(key, lang);
  if (!v || v.startsWith("⟦")) fails.push(`tr: ${key} [${lang}] does not resolve`);
}
const cache = new Map();
// JSX writes & as &amp; and ' as &apos;: compare against both spellings
const variants = (t) => [t, t.replace(/&/g, "&amp;"), t.replace(/'/g, "\'"), t.replace(/'/g, "&apos;")];
for (const [name, { text, src }] of Object.entries(m.S)) {
  n++;
  const p = join(PRODUCT, src);
  if (!existsSync(p)) { fails.push(`S.${name}: product file missing: ${src}`); continue; }
  if (!cache.has(p)) cache.set(p, readFileSync(p, "utf8"));
  if (!variants(text).some((v) => cache.get(p).includes(v))) fails.push(`S.${name}: "${text}" is not in ${src}`);
}
for (const f of fails) console.error("  ✗ " + f);
if (n === 0) { console.error("strings: VACUOUS — looked at 0 strings"); process.exit(1); }
console.log(`strings: ${fails.length ? "FAIL" : "ok"} — ${n} checked (${m.TR_KEYS.length} i18n keys × 2 languages, ${Object.keys(m.S).length} hard-coded across ${cache.size} product files), ${fails.length} failing`);
process.exit(fails.length ? 1 : 0);
