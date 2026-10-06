import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

import { EndScene, HookScene, ScreenScene, SCREENS, type SceneProps } from "./components/Scenes";
import { deriveLayout, type CutId, type Layout } from "./core/layout-core";
import { frameToSec, localSecond, sceneSecond, secToFrame, timelineFor, type Beat } from "./core/timeline";
import { cuesFor, dbToGain, duckDbAt } from "./cues";
import music from "./data/music.json";
import { FILM_FONT } from "./fonts";
import type { ScreenId } from "./replica/screenplays";

/** Every component reads the layout from here, never from the video config directly. */
export const useLayout = (): Layout => {
  const { width, height } = useVideoConfig();
  return React.useMemo(() => deriveLayout(width, height), [width, height]);
};

const BeatView: React.FC<{ beat: Beat }> = ({ beat }) => {
  const frame = useCurrentFrame(); // sequence-local
  const layout = useLayout();
  const props: SceneProps = {
    scene: beat.scene, prevWash: beat.prev?.wash, index: beat.index, layout,
    t: sceneSecond(beat, frame), sec: localSecond(frame), dur: beat.durationSec,
  };
  if (beat.scene.kind === "hook") return <HookScene {...props} />;
  if (beat.scene.kind === "end") return <EndScene {...props} />;
  return <ScreenScene {...props} />;
};

/** Sound lives in exactly one place, above the picture, outside every scene. */
const FilmAudio: React.FC<{ cut: CutId }> = ({ cut }) => {
  const cues = React.useMemo(() => cuesFor(cut), [cut]);
  return (
    <>
      <Audio src={staticFile(music.beds[cut].file)} volume={(f) => dbToGain(duckDbAt(frameToSec(f), cues))} />
      {cues.map((c, i) => (
        <Sequence key={i} from={secToFrame(c.startSec)} durationInFrames={secToFrame(c.durationSec) + secToFrame(0.1)} layout="none" name={`${c.role} ${c.why}`}>
          <Audio src={staticFile(c.file)} volume={dbToGain(c.gainDb)} />
        </Sequence>
      ))}
    </>
  );
};

export const Film: React.FC<{ cut: CutId }> = ({ cut }) => {
  const tl = timelineFor(cut);
  return (
    <AbsoluteFill style={{ backgroundColor: "#f4efe3", fontFamily: FILM_FONT.ui }}>
      {tl.beats.map((beat) => (
        <Sequence key={beat.index} name={`${beat.index} ${beat.scene.id}`} from={beat.startFrame} durationInFrames={beat.durationInFrames} layout="none">
          <BeatView beat={beat} />
        </Sequence>
      ))}
      <FilmAudio cut={cut} />
    </AbsoluteFill>
  );
};

/** Look-loop instrument: one replica screen alone, on its own clock. Not a deliverable. */
export const ScreenProbe: React.FC<{ screen: ScreenId; mobile: boolean }> = ({ screen, mobile }) => {
  const frame = useCurrentFrame();
  const View = SCREENS[screen];
  return (
    <AbsoluteFill style={{ backgroundColor: "#fff", fontFamily: FILM_FONT.ui }}>
      <View t={frameToSec(frame)} mobile={mobile} />
    </AbsoluteFill>
  );
};
