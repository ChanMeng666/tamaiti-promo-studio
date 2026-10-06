/**
 * The cue sheet: derived by walking the cut, never hand-placed. React-free.
 *
 * WHEN comes from the screenplays' own event tables, mapped through each
 * beat's window; WHAT and HOW LOUD come from src/data/sfx.json. A cue names a
 * role, never a file.
 */

import type { CutId } from "./core/layout-core";
import { filmSecond, timelineFor } from "./core/timeline";
import sfx from "./data/sfx.json";
import { EVENTS, type CueRole } from "./replica/screenplays";

export interface Cue {
  role: CueRole;
  /** when it should be HEARD, in film seconds */
  atSec: number;
  /** when the file starts: a transient is anchored on its onset */
  startSec: number;
  file: string;
  durationSec: number;
  gainDb: number;
  duckDb: number;
  why: string;
}

type Role = { gainDb: number; duckDb: number; variants: string[]; texture?: boolean };
const ROLES = sfx.roles as unknown as Record<CueRole, Role>;
const FILES = sfx.files as Record<string, { file: string; durationSec: number; onsetSec: number }>;

const make = (role: CueRole, atSec: number, variant: number, why: string, trimDb = 0): Cue => {
  const r = ROLES[role];
  const name = r.variants[((variant % r.variants.length) + r.variants.length) % r.variants.length];
  const f = FILES[name];
  // a texture is anchored on its start; a transient on its first strong onset
  const startSec = Math.max(0, r.texture ? atSec - f.durationSec * 0.45 : atSec - f.onsetSec);
  return { role, atSec, startSec, file: f.file, durationSec: f.durationSec, gainDb: r.gainDb + trimDb, duckDb: r.duckDb, why };
};

export const cuesFor = (cut: CutId): Cue[] => {
  const tl = timelineFor(cut);
  const cues: Cue[] = [];
  for (const beat of tl.beats) {
    // every scene change is a breath of air, in then out
    if (beat.index > 0 && beat.scene.kind !== "end") cues.push(make("move", beat.startSec, beat.index, `cut to ${beat.scene.id}`, -2));
    if (beat.scene.kind === "end") cues.push(make("end", beat.startSec, 0, "the end card lands on the cadence"));
    const screen = beat.scene.screen;
    if (!screen) continue;
    for (const ev of EVENTS[screen]) {
      // only what this cut's window actually shows, with a frame of grace at the edges
      if (ev.at < beat.from + 0.05 || ev.at > beat.to - 0.12) continue;
      cues.push(make(ev.role, filmSecond(beat, ev.at), ev.variant ?? 0, `${screen} @${ev.at.toFixed(2)}s`, ev.gainDb ?? 0));
    }
  }
  return cues.filter((c) => c.atSec < tl.totalSec - 0.05).sort((a, b) => a.startSec - b.startSec);
};

/** The bed's gain, in dB, at a film second: per-cue ducks, deepest wins, never summed. */
export const duckDbAt = (sec: number, cues: readonly Cue[]): number => {
  const ATTACK = 0.04, HOLD = 0.45, RELEASE = 0.5;
  let deepest = 0;
  for (const c of cues) {
    if (c.duckDb >= 0) continue;
    const d = sec - c.atSec;
    let k = 0;
    if (d >= -ATTACK && d < 0) k = (d + ATTACK) / ATTACK;
    else if (d >= 0 && d <= HOLD) k = 1;
    else if (d > HOLD && d < HOLD + RELEASE) k = 1 - (d - HOLD) / RELEASE;
    deepest = Math.min(deepest, c.duckDb * k);
  }
  return deepest;
};

export const dbToGain = (db: number): number => 10 ** (db / 20);
