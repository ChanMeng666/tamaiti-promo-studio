/**
 * The scene library: every scene that may appear in a cut. React-free.
 *
 * A scene is reusable material; an EDL row (src/edits.ts) says how long it is
 * on screen in one cut and which window of its screenplay plays.
 */

import { COPY, type CopyLine } from "./copy";
import { COACH, DASH, GOALS, JOURNAL, MARA, WHANAU, type ScreenId } from "./replica/screenplays";

export type SceneId = "hook" | "dashboard" | "maramataka" | "goals" | "journal" | "coach" | "whanau" | "end";
export type WashId = "paper" | "pounamu" | "moana" | "kowhai" | "po" | "ata";

export interface Scene {
  id: SceneId;
  kind: "hook" | "screen" | "end";
  intent: string;
  /** length of the scene's own screenplay, in seconds */
  durationSec: number;
  screen?: ScreenId;
  /** the address shown in the browser bar */
  path?: string;
  copy?: CopyLine;
  /** the colour script: the damp wash behind the product window */
  wash: WashId;
}

export const SCENES: Readonly<Record<SceneId, Scene>> = {
  hook: { id: "hook", kind: "hook", intent: "Open on the night the maramataka is read by, and say what this is.", durationSec: 5, copy: COPY.hook, wash: "po" },
  dashboard: { id: "dashboard", kind: "screen", intent: "The daily ritual: te reo first, a proverb, a check-in.", durationSec: DASH.dur, screen: "dashboard", path: "/dashboard", copy: COPY.dashboard, wash: "pounamu" },
  maramataka: { id: "maramataka", kind: "screen", intent: "The lunar calendar is the product's own data, night by night.", durationSec: MARA.dur, screen: "maramataka", path: "/maramataka", copy: COPY.maramataka, wash: "po" },
  goals: { id: "goals", kind: "screen", intent: "The money shot: pick a plan, record a saving, watch it move.", durationSec: GOALS.dur, screen: "goals", path: "/goals", copy: COPY.goals, wash: "kowhai" },
  journal: { id: "journal", kind: "screen", intent: "Reflection across hauora, by voice.", durationSec: JOURNAL.dur, screen: "journal", path: "/journal", copy: COPY.journal, wash: "moana" },
  coach: { id: "coach", kind: "screen", intent: "A real-time voice coach.", durationSec: COACH.dur, screen: "coach", path: "/financial-coach", copy: COPY.coach, wash: "pounamu" },
  whanau: { id: "whanau", kind: "screen", intent: "Nobody does this alone, and privacy stays with the user.", durationSec: WHANAU.dur, screen: "whanau", path: "/support", copy: COPY.whanau, wash: "ata" },
  end: { id: "end", kind: "end", intent: "First light: the name, where to go, and what the viewer just watched.", durationSec: 5, wash: "ata" },
};

export const SCENE_IDS = Object.keys(SCENES) as SceneId[];
