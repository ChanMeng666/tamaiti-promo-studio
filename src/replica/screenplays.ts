/**
 * The screenplays: WHEN things happen on each replica screen, in seconds on
 * that screen's own clock. React-free and content-free.
 *
 * The screens read these constants to paint; the cue sheet reads the same
 * constants to place sounds. One table, so a sound cannot drift off the
 * gesture that makes it.
 */

export type CueRole = "click" | "type" | "move" | "appear" | "tick" | "reward" | "end";
export interface ScreenEvent { at: number; role: CueRole; variant?: number; gainDb?: number }

export const DASH = {
  dur: 10,
  quoteFrom: 0.45, quoteTo: 2.3,
  toggleAt: 3.0,
  scrollFrom: 3.55, scrollTo: 4.6,
  moodAt: 5.4,
  slideFrom: 6.05, slideTo: 7.0,
  saveAt: 7.75, savedAt: 8.05,
} as const;

export const MARA = {
  dur: 10,
  cascadeFrom: 0.15, cascadeStep: 0.035, cascadeDur: 0.32,
  scrollFrom: 1.5, scrollTo: 2.5,
  clickAt: 3.4,
  dialogIn: 0.34,
  closeAt: 7.5,
  /** after the dialog: the ring walks on, one night at a time */
  walkFrom: 8.0, walkStep: 0.26, walkNights: 7,
} as const;

export const GOALS = {
  dur: 10,
  optFrom: 0.3, optStep: 0.13,
  scrollFrom: 1.3, scrollTo: 2.2,
  pickAt: 2.8,
  cutAt: 4.3, cutDur: 0.42,
  metricsFrom: 4.75,
  typeFrom: 5.7, typeTo: 6.3,
  recordAt: 6.8,
  scroll2From: 6.95, scroll2To: 7.65,
  growFrom: 7.45, growTo: 8.6,
} as const;

export const JOURNAL = {
  dur: 6,
  micAt: 0.5,
  stopAt: 2.2,
  toastAt: 2.4,
  scrollFrom: 2.5, scrollTo: 3.2,
  sendAt: 3.0,
  fillFrom: 3.3, fillStep: 0.5, fillDur: 0.7,
} as const;

export const COACH = {
  dur: 6,
  startAt: 0.6,
  connectedAt: 1.25,
  userAt: 1.5,
  coachAt: 2.3, coachTo: 4.5,
} as const;

export const WHANAU = {
  dur: 10,
  statsFrom: 0.35, statsTo: 1.5,
  act1At: 1.7, act2At: 2.15,
  navAt: 3.7,
  cutAt: 3.85, cutDur: 0.42,
  scrollFrom: 4.5, scrollTo: 5.2,
  toggleOnAt: 5.7,
  toggleOffAt: 6.7,
  saveAt: 7.7, savedAt: 8.0,
} as const;

const keys = (from: number, to: number, n: number): ScreenEvent[] =>
  Array.from({ length: n }, (_, i) => ({ at: from + ((to - from) * i) / n, role: "type" as const, variant: i }));

/** What can be heard on each screen. Derived from the tables above, never typed twice. */
export const EVENTS: Record<"dashboard" | "maramataka" | "goals" | "journal" | "coach" | "whanau", ScreenEvent[]> = {
  dashboard: [
    { at: DASH.toggleAt, role: "click", variant: 0 },
    { at: DASH.scrollFrom, role: "move", variant: 0 },
    { at: DASH.moodAt, role: "click", variant: 1 },
    { at: DASH.slideTo - 0.1, role: "tick", variant: 0 },
    { at: DASH.saveAt, role: "click", variant: 2 },
    { at: DASH.savedAt, role: "reward", variant: 0 },
  ],
  maramataka: [
    ...[0, 6, 12, 18, 24].map((i, n) => ({ at: MARA.cascadeFrom + i * MARA.cascadeStep, role: "tick" as const, variant: n, gainDb: -4 })),
    { at: MARA.clickAt, role: "click", variant: 0 },
    { at: MARA.clickAt + 0.06, role: "appear", variant: 0 },
    { at: MARA.closeAt, role: "move", variant: 1 },
    ...Array.from({ length: MARA.walkNights }, (_, i) => ({ at: MARA.walkFrom + i * MARA.walkStep, role: "tick" as const, variant: i })),
  ],
  goals: [
    ...Array.from({ length: 7 }, (_, i) => ({ at: GOALS.optFrom + i * GOALS.optStep, role: "tick" as const, variant: i, gainDb: -3 })),
    { at: GOALS.pickAt, role: "click", variant: 0 },
    { at: GOALS.cutAt, role: "move", variant: 0 },
    ...keys(GOALS.typeFrom, GOALS.typeTo, 3),
    { at: GOALS.recordAt, role: "click", variant: 1 },
    { at: GOALS.growTo - 0.25, role: "reward", variant: 1 },
  ],
  journal: [
    { at: JOURNAL.micAt, role: "click", variant: 0 },
    { at: JOURNAL.stopAt, role: "click", variant: 1 },
    { at: JOURNAL.toastAt, role: "appear", variant: 1 },
    { at: JOURNAL.sendAt, role: "appear", variant: 2 },
    ...Array.from({ length: 4 }, (_, i) => ({ at: JOURNAL.fillFrom + i * JOURNAL.fillStep, role: "tick" as const, variant: i })),
  ],
  coach: [
    { at: COACH.startAt, role: "click", variant: 0 },
    { at: COACH.connectedAt, role: "reward", variant: 0, gainDb: -4 },
    { at: COACH.userAt, role: "appear", variant: 0 },
    { at: COACH.coachAt, role: "appear", variant: 1 },
  ],
  whanau: [
    { at: WHANAU.act1At, role: "appear", variant: 0 },
    { at: WHANAU.act2At, role: "appear", variant: 1 },
    { at: WHANAU.navAt, role: "click", variant: 0 },
    { at: WHANAU.cutAt, role: "move", variant: 0 },
    { at: WHANAU.toggleOnAt, role: "click", variant: 1 },
    { at: WHANAU.toggleOffAt, role: "click", variant: 2 },
    { at: WHANAU.saveAt, role: "click", variant: 0 },
    { at: WHANAU.savedAt, role: "reward", variant: 0 },
  ],
};

export type ScreenId = keyof typeof EVENTS;
