/**
 * The film's own voice: every word on screen that is NOT the product's UI.
 * React-free. Each line has a row in docs/copy-clearance.md, and `npm run
 * verify` fails on a line with no row.
 *
 * Line breaks are authored per aspect and rendered nowrap: the same sentence
 * breaks differently at 1920 and at 1080 wide, and a bad break should show up
 * as an overflow, not as a silent reflow.
 */

import type { Aspect } from "./core/layout-core";

export interface CopyLine {
  id: string;
  /** a short label over the line: the Māori concept the scene is about */
  eyebrow?: string;
  lines: Readonly<Record<Aspect, readonly string[]>>;
}

const line = (id: string, eyebrow: string | undefined, landscape: string[], portrait: string[]): CopyLine =>
  ({ id, eyebrow, lines: { landscape, portrait } });

export const COPY = {
  hook: line("hook", undefined,
    ["Financial wellness", "that weaves Māori", "wisdom with AI."],
    ["Financial wellness", "that weaves Māori", "wisdom with AI."]),
  dashboard: line("dashboard", "Whakataukī",
    ["Begin each day with a proverb and a check-in."],
    ["Begin each day with", "a proverb and a check-in."]),
  maramataka: line("maramataka", "Maramataka",
    ["Plan by the moon, one night at a time."],
    ["Plan by the moon,", "one night at a time."]),
  goals: line("goals", "Whāinga",
    ["Choose one of seven action plans. Watch the goal grow."],
    ["Choose one of seven action", "plans. Watch the goal grow."]),
  journal: line("journal", "Hauora",
    ["Say your intentions aloud. The journal fills itself in."],
    ["Say your intentions aloud.", "The journal fills itself in."]),
  coach: line("coach", "Kōrero",
    ["Talk money through with a voice coach."],
    ["Talk money through", "with a voice coach."]),
  whanau: line("whanau", "Whānau",
    ["Bring your whānau along. You choose what they see."],
    ["Bring your whānau along.", "You choose what they see."]),
} as const;

export const END = {
  url: "tamaiti.whiri-ai.com",
  /** the honesty line: what the viewer has been looking at */
  disclosure: {
    landscape: ["Interface recreated in code for this film. Demo account and figures are illustrative."],
    portrait: ["Interface recreated in code for this film.", "Demo account and figures are illustrative."],
  } as Readonly<Record<Aspect, readonly string[]>>,
} as const;

/** Every film-voice string, flat, for the clearance gate. */
export const allCopy = (): string[] => [
  ...Object.values(COPY).flatMap((c) => [
    ...(c.eyebrow ? [c.eyebrow] : []),
    c.lines.landscape.join(" "),
    c.lines.portrait.join(" "),
  ]),
  END.url,
  END.disclosure.landscape.join(" "),
  END.disclosure.portrait.join(" "),
];
