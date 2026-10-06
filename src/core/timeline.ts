/**
 * THE ONLY FRAME ARITHMETIC IN THE REPO.
 *
 * Intent is written in seconds (the EDLs, the screenplays, the cue sheet).
 * This file converts seconds to frames once; no other file may contain a frame
 * literal, and `npm run verify` greps for one.
 */

import { CUT_SECONDS, FPS, type CutId } from "./layout-core";
import { EDITS, type Edit } from "../edits";
import { SCENES, type Scene } from "../scenes";
import music from "../data/music.json";

export const secToFrame = (sec: number): number => Math.round(sec * FPS);
export const frameToSec = (frame: number): number => frame / FPS;

export interface Beat {
  index: number;
  edit: Edit;
  scene: Scene;
  prev?: Scene;
  startSec: number;
  endSec: number;
  durationSec: number;
  startFrame: number;
  durationInFrames: number;
  /** window into the scene's own screenplay clock */
  from: number;
  to: number;
  /** how many screenplay seconds pass per film second */
  rate: number;
}

export interface ResolvedCut { cut: CutId; totalSec: number; totalFrames: number; beats: Beat[]; problems: string[] }

export const downbeatsFor = (cut: CutId): readonly number[] => music.beds[cut].downbeats;
export const BAR_SEC: number = music.barSec;
export const BEAT_SEC: number = music.beatSec;

export const resolveCut = (cut: CutId): ResolvedCut => {
  const edits = EDITS[cut];
  const totalSec = CUT_SECONDS[cut];
  const totalFrames = secToFrame(totalSec);
  const problems: string[] = [];
  const beats: Beat[] = [];
  let at = 0;
  edits.forEach((edit, index) => {
    const scene = SCENES[edit.scene];
    const startSec = at;
    const endSec = index === edits.length - 1 ? totalSec : at + edit.sec;
    at += edit.sec;
    const startFrame = secToFrame(startSec);
    // the last beat absorbs the rounding, so the frame total is exact
    const endFrame = index === edits.length - 1 ? totalFrames : secToFrame(endSec);
    const from = edit.from ?? 0;
    const to = edit.to ?? scene.durationSec;
    beats.push({
      index, edit, scene, prev: index > 0 ? SCENES[edits[index - 1].scene] : undefined,
      startSec, endSec, durationSec: endSec - startSec,
      startFrame, durationInFrames: endFrame - startFrame,
      from, to, rate: (to - from) / (endSec - startSec),
    });
  });
  if (Math.abs(at - totalSec) > 1e-6) problems.push(`cut ${cut}: beats sum to ${at}s, not ${totalSec}s`);
  return { cut, totalSec, totalFrames, beats, problems };
};

const built = {
  "15": resolveCut("15"),
  "30": resolveCut("30"),
  "60": resolveCut("60"),
} satisfies Record<CutId, ResolvedCut>;

export const timelineFor = (cut: CutId): ResolvedCut => built[cut];
export const totalFramesFor = (cut: CutId): number => built[cut].totalFrames;

/** Film second → the scene's own screenplay second, for a SEQUENCE-LOCAL frame. */
export const sceneSecond = (beat: Beat, localFrame: number): number => {
  const p = beat.durationInFrames <= 0 ? 0 : Math.min(1, Math.max(0, localFrame / beat.durationInFrames));
  return beat.from + (beat.to - beat.from) * p;
};

/** Seconds since this beat began, for a sequence-local frame. */
export const localSecond = (localFrame: number): number => frameToSec(localFrame);

/** Screenplay second → film second inside a beat (for the cue sheet). */
export const filmSecond = (beat: Beat, sceneSec: number): number =>
  beat.startSec + (sceneSec - beat.from) / beat.rate;
