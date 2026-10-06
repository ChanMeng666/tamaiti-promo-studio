/**
 * The edit decision lists: one per cut length, in SECONDS.
 *
 * The bed is 96 BPM in 4/4, so a bar is exactly 2.5 s and every boundary below
 * sits on a bar line of the cut's own arrangement (src/data/music.json).
 * `from`/`to` choose a window of the scene's screenplay; window / sec is how
 * fast the replica runs.
 *
 * Short cuts drop beats; they do not shorten all of them.
 */

import type { CutId } from "./core/layout-core";
import type { SceneId } from "./scenes";

export interface Edit {
  scene: SceneId;
  /** on-screen seconds */
  sec: number;
  /** window into the scene's own screenplay clock */
  from?: number;
  to?: number;
  /** why this beat is this long */
  why: string;
}

export const EDITS: Readonly<Record<CutId, readonly Edit[]>> = {
  "60": [
    { scene: "hook", sec: 5, why: "Intro, 2 bars. Eight words and a moonrise; the bed is only pad and tines." },
    { scene: "dashboard", sec: 10, why: "Verse, 4 bars. The language switch, the proverb, the check-in: real time." },
    { scene: "maramataka", sec: 10, why: "Verse 2, 4 bars. The month fills, one night opens, the ring walks on." },
    { scene: "goals", sec: 10, why: "Chorus, 4 bars. The money shot gets the tune and plays at 1.0x." },
    { scene: "journal", sec: 5, why: "Breakdown, 2 bars. Drums out: the reflective half. 1.2x." },
    { scene: "coach", sec: 5, why: "Breakdown, 2 bars. Two real lines of dialogue need the quiet. 1.2x." },
    { scene: "whanau", sec: 10, why: "Chorus 2, 4 bars. The lift carries the people." },
    { scene: "end", sec: 5, why: "Cadence, 2 bars. The chord rings under first light." },
  ],
  "30": [
    { scene: "hook", sec: 2.5, from: 1.2, to: 5, why: "Intro, 1 bar. Opens with the moon already risen." },
    { scene: "dashboard", sec: 5, from: 2.5, to: 8.7, why: "Verse, bars 1-2. From the language switch to the saved check-in. 1.24x." },
    { scene: "maramataka", sec: 5, from: 1.2, to: 7.4, why: "Verse, bars 3-4. The night opens. 1.24x." },
    { scene: "goals", sec: 5, from: 2.4, to: 8.9, why: "Chorus, bars 1-2. Pick, record, grow. 1.26x." },
    { scene: "journal", sec: 2.5, from: 2.2, to: 5.6, why: "Chorus, bar 3. The fields fill. 1.36x." },
    { scene: "coach", sec: 2.5, from: 1.1, to: 4.6, why: "Chorus, bar 4. Connected, and the coach answers. 1.4x." },
    { scene: "whanau", sec: 5, from: 3.3, to: 8.6, why: "Lift, 2 bars. The permission switches. 1.06x." },
    { scene: "end", sec: 2.5, from: 1.4, to: 5, why: "Cadence, 1 bar." },
  ],
  "15": [
    { scene: "hook", sec: 2.5, from: 1.2, to: 5, why: "Intro, 1 bar." },
    { scene: "dashboard", sec: 2.5, from: 5.0, to: 8.5, why: "Chorus bar 1. One gesture: the check-in. 1.4x." },
    { scene: "maramataka", sec: 2.5, from: 3.0, to: 6.4, why: "Chorus bar 2. One night, open. 1.36x." },
    { scene: "goals", sec: 2.5, from: 6.3, to: 8.9, why: "Chorus bar 3. The saving lands, at 1.0x." },
    { scene: "whanau", sec: 2.5, from: 5.3, to: 8.5, why: "Chorus bar 4. The switches. 1.28x." },
    { scene: "end", sec: 2.5, from: 1.4, to: 5, why: "Cadence, 1 bar." },
  ],
};
