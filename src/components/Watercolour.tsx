import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

import { easeInOutCubic, easeOutCubic, lerp, prog } from "../core/ease";
import type { Layout } from "../core/layout-core";

/** The plates are painted at this size by art/paint.py. */
const PLATE = { w: 2600, h: 2000, horizon: 1180 };

export type Time = "night" | "dawn";

const art = (time: Time, layer: string) => staticFile(`art/${time}/${layer}.webp`);

/**
 * The painted landscape, assembled by depth.
 *
 * Hill layers are pigment on white, composited with multiply: the same maths
 * as a glaze, so a near hill over a far one darkens the way a second wash
 * would. The moon, the sun and the glints are light, so they sit in normal
 * blend between the washes.
 *
 * `t` is the scene's own second. The camera pushes in slowly and drifts
 * sideways; each layer moves by its depth, which is all parallax is.
 */
export const Watercolour: React.FC<{ time: Time; t: number; dur: number; layout: Layout; rise?: boolean }> = ({ time, t, dur, layout, rise = true }) => {
  const wide = layout.aspect === "landscape";
  // how large the plate is drawn, and where its centre and horizon land
  const scale = wide ? 1.0 : layout.height / PLATE.h + 0.06;
  const cx = wide ? layout.width * 0.66 : layout.width * 0.5;
  const horizonY = wide ? layout.height * 0.655 : layout.height * 0.575;
  const w = PLATE.w * scale;
  const h = PLATE.h * scale;
  const left = cx - w / 2;
  const top = horizonY - PLATE.horizon * scale;

  const p = easeInOutCubic(prog(t, 0, dur));
  const pan = lerp(-1, 1, p);          // -1 … 1 across the beat
  const push = 1 + 0.035 * p;

  const layer = (depth: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
    position: "absolute", left, top, width: w, height: h,
    transform: `translate(${-pan * depth * 26}px, ${pan * depth * 5}px) scale(${1 + (push - 1) * (0.4 + depth)})`,
    transformOrigin: `${cx - left}px ${horizonY - top}px`,
    ...extra,
  });

  // the moon climbs out of the horizon glow; the sun only swells
  const climb = rise ? easeOutCubic(prog(t, 0, Math.min(dur, 3.6))) : 1;
  const orb = time === "night"
    ? { src: staticFile("art/moon.webp"), size: 900 * scale * 0.92, y: lerp(horizonY - 150 * scale, horizonY - (wide ? 440 : 255) * scale, climb), opacity: 1 }
    : { src: staticFile("art/sun.webp"), size: 900 * scale * 1.1, y: horizonY - lerp(20, 70, climb) * scale, opacity: lerp(0.75, 1, climb) };
  const shimmer = 0.72 + 0.2 * Math.sin(t * 2.3) + 0.08 * Math.sin(t * 5.1 + 1);

  return (
    <AbsoluteFill style={{ backgroundColor: time === "night" ? "#1d2b55" : "#f3c7a4", overflow: "hidden" }}>
      <Img src={art(time, "sky")} style={layer(0.05)} />
      <Img src={orb.src} style={{
        position: "absolute", left: cx - orb.size / 2 - pan * 3, top: orb.y - orb.size / 2, width: orb.size, height: orb.size, opacity: orb.opacity,
      }} />
      <Img src={art(time, "far")} style={layer(0.18, { mixBlendMode: "multiply" })} />
      <Img src={art(time, "mid")} style={layer(0.34, { mixBlendMode: "multiply" })} />
      <Img src={art(time, "sea")} style={layer(0.5, { mixBlendMode: "multiply" })} />
      <Img src={art(time, "glints")} style={layer(0.5, { opacity: shimmer * (time === "night" ? 0.95 * climb : 0.85), transform: `${layer(0.5).transform} translateX(${Math.sin(t * 1.3) * 4}px)` })} />
      <Img src={art(time, "near")} style={layer(1.0, { mixBlendMode: "multiply" })} />
    </AbsoluteFill>
  );
};
