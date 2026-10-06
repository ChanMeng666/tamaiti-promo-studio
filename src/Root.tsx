import React from "react";
import { Composition } from "remotion";

import { DELIVERABLES, FPS } from "./core/layout-core";
import { secToFrame, totalFramesFor } from "./core/timeline";
import { Film, ScreenProbe } from "./Film";
import { EVENTS, type ScreenId } from "./replica/screenplays";
import { SCENES } from "./scenes";

/**
 * Six masters: three lengths x two aspects, mapped from one table.
 *
 * There is no calculateMetadata: lengths come from the EDLs through
 * core/timeline.ts, synchronously. Nothing probes a media file at render time.
 */
export const RemotionRoot: React.FC = () => (
  <>
    {DELIVERABLES.map((d) => (
      <Composition key={d.id} id={d.id} component={Film} defaultProps={{ cut: d.cut }}
        durationInFrames={totalFramesFor(d.cut)} fps={FPS} width={d.width} height={d.height} />
    ))}
    {(Object.keys(EVENTS) as ScreenId[]).flatMap((screen) =>
      [false, true].map((mobile) => (
        <Composition key={`${screen}-${mobile}`} id={`Probe-${screen}-${mobile ? "mobile" : "desktop"}`} component={ScreenProbe}
          defaultProps={{ screen, mobile }} durationInFrames={secToFrame(SCENES[screen].durationSec)} fps={FPS}
          width={mobile ? 390 : 1024} height={mobile ? 540 : 576} />
      )),
    )}
  </>
);
