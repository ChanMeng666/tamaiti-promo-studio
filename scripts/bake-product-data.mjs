#!/usr/bin/env node
/**
 * Bake the product's own strings and reference data into the film.
 *
 * The replica never types a product string that this script can read instead:
 * it bundles the product's real modules (i18n tables, the Maramataka service,
 * the moon-phase SVG generator, goal types, action-plan themes, journal field
 * definitions) with esbuild, executes them in Node, and writes one flat JSON.
 * Change the product's copy and the next bake changes the film.
 *
 * It reads the product repo and writes exactly one file here. It never writes
 * to the product repo, deletes nothing, and is byte-idempotent.
 *
 *   node scripts/bake-product-data.mjs [--product ../tam-ai-ti-web] [--check]
 */

import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flag = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
const PRODUCT = resolve(HERE, "..", flag("--product") ?? "../tam-ai-ti-web");
const OUT = resolve(HERE, "..", "src", "replica", "data", "product.generated.json");
const CHECK = argv.includes("--check");

if (!existsSync(join(PRODUCT, "app", "i18n", "pages", "dashboard.ts"))) {
  console.error(`bake: product repo not found at ${PRODUCT}`);
  process.exit(1);
}

/** The product files this bake reads. Recorded with their sha256 in the output. */
const SOURCES = [
  "app/i18n/pages/dashboard.ts",
  "app/i18n/pages/goals.ts",
  "app/i18n/pages/journal.ts",
  "app/i18n/pages/maramataka.ts",
  "app/i18n/pages/support.ts",
  "app/i18n/pages/home.ts",
  "app/i18n/navigation.ts",
  "app/lib/maramataka-service.ts",
  "app/utils/moon-phase-svgs-v2.ts",
  "app/config/goal-types.ts",
  "lib/actionPlanThemes.ts",
  "app/journal/config/journal-fields.config.ts",
  "data/exports/2026-03-29-1741/whakatauki.json",
];

const entry = `
export { dashboardTranslations } from "./app/i18n/pages/dashboard";
export { goalsTranslations } from "./app/i18n/pages/goals";
export { journalTranslations } from "./app/i18n/pages/journal";
export { maramatakaTranslations } from "./app/i18n/pages/maramataka";
export { supportTranslations } from "./app/i18n/pages/support";
export { homeTranslations } from "./app/i18n/pages/home";
export { navigationTranslations } from "./app/i18n/navigation";
export { getMaramatakaRange, getEnergyLevelColor } from "./app/lib/maramataka-service";
export { getMoonPhaseSvg } from "./app/utils/moon-phase-svgs-v2";
export { GOAL_TYPES } from "./app/config/goal-types";
export { ACTION_PLAN_THEMES } from "./lib/actionPlanThemes";
export { MORNING_JOURNAL_FIELDS, EVENING_JOURNAL_FIELDS } from "./app/journal/config/journal-fields.config";
`;

const built = await build({
  stdin: { contents: entry, resolveDir: PRODUCT, sourcefile: "bake-entry.ts", loader: "ts" },
  bundle: true, write: false, format: "esm", platform: "node", target: "node22", logLevel: "silent",
});
const mod = await import("data:text/javascript;base64," + Buffer.from(built.outputFiles[0].text).toString("base64"));

// ── Maramataka: one real month, through the product's own date lookup ────────
// June 2025 ("Pipiri 2025") is the first month of the product's authentic
// mapping table and the month its calendar page falls back to.
const MONTH = { year: 2025, month: 5, label: "Pipiri 2025" };
const range = mod.getMaramatakaRange(new Date(MONTH.year, MONTH.month, 1), 30);
const days = range.map((r, i) => {
  const date = new Date(MONTH.year, MONTH.month, 1 + i);
  return {
    date: r.gregorianDate,
    dayOfMonth: 1 + i,
    weekday: date.getDay(),
    cycleDay: r.cycleDay,
    name: r.currentDay.moonNameMi,
    energyLevel: r.currentDay.energyLevel,
    description: r.currentDay.description,
    activities: r.currentDay.activities,
    fishingGood: r.currentDay.fishingGood,
    plantingGood: r.currentDay.plantingGood,
    restDay: r.currentDay.restDay,
    highProductivity: r.currentDay.highProductivity,
    isNewMoon: r.isNewMoon,
    isFullMoon: r.isFullMoon,
    isDoubleDay: r.isDoubleDay,
    doubleDayNames: r.doubleDayNames ?? null,
    doubleDayCycleDays: r.doubleDayCycleDays ?? null,
    cycleDaysRemaining: r.cycleDaysRemaining,
  };
});
if (days.some((d) => d.date.slice(0, 7) !== "2025-06")) throw new Error("bake: month range drifted");

// the inner markup of each phase's SVG: the product returns a full <svg> string
const moons = {};
for (let d = 1; d <= 30; d++) {
  const svg = mod.getMoonPhaseSvg(d);
  const m = /^<svg viewBox="0 0 50 50">(.*)<\/svg>$/s.exec(svg.trim());
  if (!m) throw new Error(`bake: unexpected moon svg for day ${d}: ${svg.slice(0, 60)}`);
  moons[d] = m[1];
}

// ── Whakataukī: real rows from the product's own database export ─────────────
const rows = Object.values(JSON.parse(readFileSync(join(PRODUCT, "data/exports/2026-03-29-1741/whakatauki.json"), "utf8")));
const pick = (textMi) => {
  const r = rows.find((x) => x.textMi === textMi);
  if (!r) throw new Error(`bake: whakataukī not found: ${textMi}`);
  return { textMi: r.textMi, textEn: r.textEn, meaning: r.meaning };
};
const whakatauki = {
  seed: pick("Poipoia te kākano kia puāwai"),
  pounamu: pick("Ahakoa he iti, he pounamu"),
  takitini: pick("Ehara taku toa i te toa takitahi, engari he toa takitini"),
};

const energyClass = Object.fromEntries(
  ["High Energy", "Medium Energy", "Low Energy", "No Energy"].map((e) => [e, mod.getEnergyLevelColor(e)]),
);

const journalExamples = Object.fromEntries(
  [...mod.MORNING_JOURNAL_FIELDS, ...mod.EVENING_JOURNAL_FIELDS].map((f) => [f.key, f.exampleContent]),
);

const commit = (() => {
  try { return execFileSync("git", ["-C", PRODUCT, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); }
  catch { return "unknown"; }
})();

const out = {
  $comment: "GENERATED by scripts/bake-product-data.mjs from the product repo. Do not edit; re-bake.",
  source: {
    repo: "tam-ai-ti-web",
    commit,
    files: SOURCES.map((p) => ({
      path: p,
      sha256: createHash("sha256").update(readFileSync(join(PRODUCT, p), "utf8").replace(/\r\n/g, "\n")).digest("hex"),
    })),
  },
  i18n: {
    dashboard: mod.dashboardTranslations,
    goals: mod.goalsTranslations,
    journal: mod.journalTranslations,
    maramataka: mod.maramatakaTranslations,
    support: mod.supportTranslations,
    home: mod.homeTranslations,
    navigation: mod.navigationTranslations,
  },
  maramataka: { month: MONTH, days, moons, energyClass },
  whakatauki,
  goalTypes: mod.GOAL_TYPES.map(({ code, nameEn, nameMi, icon }) => ({ code, nameEn, nameMi, icon })),
  actionPlanThemes: Object.fromEntries(
    Object.entries(mod.ACTION_PLAN_THEMES).map(([k, t]) => [k, { nameEn: t.nameEn, nameMi: t.nameMi, icon: t.icon, description: t.description }]),
  ),
  journalExamples,
};

const text = JSON.stringify(out, null, 2) + "\n";
if (CHECK) {
  const have = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (have !== text) {
    console.error("bake --check: src/replica/data/product.generated.json is STALE against the product repo. Run `npm run bake`.");
    process.exit(1);
  }
  console.log(`bake --check: ok — ${SOURCES.length} product files, product commit ${commit.slice(0, 7)}`);
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, text);
  console.log(`bake: wrote ${OUT}`);
  console.log(`  product commit ${commit.slice(0, 7)} · ${SOURCES.length} source files · ${days.length} lunar days · ${Object.keys(moons).length} moon phases`);
}
