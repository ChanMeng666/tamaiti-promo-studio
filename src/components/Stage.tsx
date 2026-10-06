import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

import { easeInOutCubic, easeOutCubic, easeOutExpo, prog } from "../core/ease";
import type { Layout } from "../core/layout-core";
import type { CopyLine } from "../copy";
import { FILM_FONT } from "../fonts";
import type { WashId } from "../scenes";

const WASH_PX = 2400;
export const INK = "#17302a";
export const POUNAMU = "#0f7a57";

const wash = (id: WashId) => staticFile(`art/wash/${id}.webp`);

/** One wash plate, covering the frame, drifting a little so the paper is never frozen. */
const Wash: React.FC<{ id: WashId; layout: Layout; drift: number; style?: React.CSSProperties }> = ({ id, layout, drift, style }) => {
  const size = Math.max(layout.width, layout.height) * 1.16;
  return (
    <Img src={wash(id)} style={{
      position: "absolute", width: size, height: size, left: (layout.width - size) / 2, top: (layout.height - size) / 2,
      transform: `translate(${drift * 22}px, ${-drift * 12}px) scale(${WASH_PX ? 1 + drift * 0.02 : 1})`, ...style,
    }} />
  );
};

/**
 * The stage behind the product window: the chapter's own damp wash.
 *
 * On a cut the new wash is brushed in OVER the one the cut is leaving, with a
 * soft diagonal edge, while the product window above it is already on screen.
 * What moves on a cut is the colour, not the product.
 */
export const Stage: React.FC<{ washId: WashId; prev?: WashId; sec: number; dur: number; layout: Layout; index: number }> = ({ washId, prev, sec, dur, layout, index }) => {
  const drift = easeInOutCubic(prog(sec, 0, dur)) * 2 - 1;
  const p = prev && prev !== washId ? easeOutCubic(prog(sec, 0, 0.55)) : 1;
  // a brush stroke: the mask's soft edge travels across, alternating direction per beat
  const dir = index % 2 === 0 ? "105deg" : "255deg";
  const edge = -30 + p * 160;
  const mask = `linear-gradient(${dir}, #000 ${edge - 28}%, transparent ${edge}%)`;
  return (
    <AbsoluteFill style={{ backgroundColor: "#f4efe3", overflow: "hidden" }}>
      {prev && p < 1 ? <Wash id={prev} layout={layout} drift={1} /> : null}
      <Wash id={washId} layout={layout} drift={drift} style={p < 1 ? { WebkitMaskImage: mask, maskImage: mask } : undefined} />
    </AbsoluteFill>
  );
};

/** One line rising out of its own clipped band. */
const MaskedLine: React.FC<{ text: string; size: number; sec: number; at: number; color: string; weight?: number; shadow?: string; align: "center" | "left" }> = ({ text, size, sec, at, color, weight = 500, shadow, align }) => {
  const words = text.split(" ");
  return (
    <div style={{ overflow: "hidden", height: size * 1.28, display: "flex", justifyContent: align === "center" ? "center" : "flex-start", whiteSpace: "nowrap" }}>
      {words.map((w, i) => {
        // the first word starts part-way out of the mask, so frame 0 is a composition
        const floor = i === 0 && at <= 0 ? 0.55 : 0;
        const p = Math.max(floor, easeOutExpo(prog(sec, at + i * 0.045, at + i * 0.045 + 0.5)));
        return (
          <span key={i} style={{
            display: "inline-block", fontFamily: FILM_FONT.voice, fontSize: size, fontWeight: weight, color, lineHeight: 1.28,
            letterSpacing: "-0.012em", transform: `translateY(${(1 - p) * size * 1.1}px)`, marginRight: i < words.length - 1 ? size * 0.26 : 0, textShadow: shadow,
          }}>{w}</span>
        );
      })}
    </div>
  );
};

/** The film's caption: a small label naming the concept, then the line. */
export const Caption: React.FC<{ copy: CopyLine; sec: number; layout: Layout; color?: string; accent?: string; shadow?: string; size?: number; box?: { x: number; y: number; w: number; h: number }; align?: "center" | "left"; delay?: number }> =
  ({ copy, sec, layout, color = INK, accent = POUNAMU, shadow, size = layout.captionSize, box = layout.caption, align = "center", delay = 0 }) => {
    const lines = copy.lines[layout.aspect];
    const rule = Math.max(0.3, easeOutCubic(prog(sec, delay, delay + 0.5)));
    return (
      <div style={{
        position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: align === "center" ? "center" : "flex-start", gap: size * 0.12,
      }}>
        {copy.eyebrow ? (
          <div style={{ display: "flex", alignItems: "center", gap: size * 0.3, marginBottom: size * 0.04 }}>
            <div style={{ width: size * 0.9 * rule, height: 3, background: accent, borderRadius: 2 }} />
            <div style={{ fontFamily: FILM_FONT.ui, fontSize: size * 0.44, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: accent, opacity: Math.max(0.6, rule) }}>{copy.eyebrow}</div>
            <div style={{ width: size * 0.9 * rule, height: 3, background: accent, borderRadius: 2 }} />
          </div>
        ) : null}
        {lines.map((l, i) => <MaskedLine key={i} text={l} size={size} sec={sec} at={delay + i * 0.12} color={color} shadow={shadow} align={align} />)}
      </div>
    );
  };
