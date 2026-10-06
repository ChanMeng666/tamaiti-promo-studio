import React from "react";
import { AbsoluteFill } from "remotion";
import { ArrowRight, Moon as MoonIcon } from "lucide-react";

import { easeOutBack, easeOutCubic, prog } from "../core/ease";
import type { Layout } from "../core/layout-core";
import { COPY, END } from "../copy";
import { FILM_FONT } from "../fonts";
import type { ScreenId } from "../replica/screenplays";
import { Coach } from "../replica/screens/Coach";
import { Dashboard } from "../replica/screens/Dashboard";
import { Goals } from "../replica/screens/Goals";
import { Journal } from "../replica/screens/Journal";
import { Maramataka } from "../replica/screens/Maramataka";
import { Whanau } from "../replica/screens/Whanau";
import { h, tr } from "../replica/strings";
import type { ScreenProps } from "../replica/ui";
import type { Scene, WashId } from "../scenes";
import { ProductWindow } from "./ProductWindow";
import { Caption, INK, Stage } from "./Stage";
import { Watercolour } from "./Watercolour";

export const SCREENS: Record<ScreenId, React.FC<ScreenProps>> = {
  dashboard: Dashboard, maramataka: Maramataka, goals: Goals, journal: Journal, coach: Coach, whanau: Whanau,
};

export interface SceneProps {
  scene: Scene;
  prevWash?: WashId;
  /** the scene's own screenplay second */
  t: number;
  /** film seconds since the beat began, and the beat's length */
  sec: number;
  dur: number;
  index: number;
  layout: Layout;
}

/** Hook: the night the maramataka is read by, and one sentence. */
export const HookScene: React.FC<SceneProps> = ({ scene, t, sec, layout }) => {
  const wide = layout.aspect === "landscape";
  const size = wide ? 92 : 86;
  const box = wide
    ? { x: layout.safe.x + 20, y: 170, w: 860, h: 400 }
    : { x: layout.safe.x, y: layout.safe.y + 10, w: layout.safe.w, h: 380 };
  return (
    <AbsoluteFill>
      <Watercolour time="night" t={t} dur={scene.durationSec} layout={layout} />
      {/* a little dusk behind the type, so it holds on any part of the sky */}
      <div style={{ position: "absolute", inset: 0, background: wide
        ? "linear-gradient(100deg, rgba(14,22,48,0.62) 0%, rgba(14,22,48,0.28) 38%, rgba(14,22,48,0) 58%)"
        : "linear-gradient(180deg, rgba(14,22,48,0.66) 0%, rgba(14,22,48,0.30) 30%, rgba(14,22,48,0) 46%)" }} />
      <Caption copy={COPY.hook} sec={sec} layout={layout} size={size} box={box} color="#fdf8ea" align={wide ? "left" : "center"}
        shadow="0 2px 18px rgba(8,14,34,0.55)" delay={0} />
    </AbsoluteFill>
  );
};

/** A product scene: the chapter's wash, the window, the caption. */
export const ScreenScene: React.FC<SceneProps> = ({ scene, prevWash, t, sec, dur, index, layout }) => {
  const View = SCREENS[scene.screen!];
  return (
    <AbsoluteFill>
      <Stage washId={scene.wash} prev={prevWash} sec={sec} dur={dur} layout={layout} index={index} />
      <ProductWindow layout={layout} sec={sec} dur={dur} path={scene.path ?? ""}>
        <View t={t} mobile={layout.aspect === "portrait"} />
      </ProductWindow>
      {scene.copy ? <Caption copy={scene.copy} sec={sec} layout={layout} delay={0.05} /> : null}
    </AbsoluteFill>
  );
};

/** End card: first light. The mark, where to go, and what the viewer just watched. */
export const EndScene: React.FC<SceneProps> = ({ scene, t, sec, layout }) => {
  const wide = layout.aspect === "landscape";
  const k = wide ? 1 : 1.06;
  const a = (at: number) => easeOutCubic(prog(sec, at, at + 0.5));
  const mark = Math.max(0.6, easeOutBack(prog(sec, 0, 0.55)));
  const top = wide ? 120 : layout.safe.y + 40;
  return (
    <AbsoluteFill>
      <Watercolour time="dawn" t={t} dur={scene.durationSec} layout={layout} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,250,240,0.55) 0%, rgba(255,250,240,0.25) 34%, rgba(255,250,240,0) 52%)" }} />
      <div style={{ position: "absolute", left: layout.safe.x, width: layout.safe.w, top, display: "flex", flexDirection: "column", alignItems: "center", gap: 26 * k }}>
        {/* the product's own mark: the crescent and the name, as its header draws them */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 * k, transform: `scale(${mark})`, opacity: Math.min(1, mark + 0.25) }}>
          <MoonIcon size={104 * k} color="#16a34a" strokeWidth={2.2} />
          <div style={{ fontFamily: FILM_FONT.ui, fontSize: 118 * k, fontWeight: 700, color: "#0a0a0a", letterSpacing: "-0.03em", lineHeight: 1 }}>{h("publicName")}</div>
        </div>
        <div style={{ fontFamily: FILM_FONT.voice, fontSize: 44 * k, fontWeight: 500, color: INK, opacity: a(0.25), transform: `translateY(${(1 - a(0.25)) * 14}px)`, textAlign: "center", lineHeight: 1.25, whiteSpace: "nowrap" }}>
          {wide ? COPY.hook.lines.landscape.join(" ") : <>{COPY.hook.lines.portrait[0]} {COPY.hook.lines.portrait[1].split(" ")[0]} {COPY.hook.lines.portrait[1].split(" ")[1]}<br />{COPY.hook.lines.portrait[1].split(" ").slice(2).join(" ")} {COPY.hook.lines.portrait[2]}</>}
        </div>
        <div style={{
          marginTop: 10 * k, display: "flex", alignItems: "center", gap: 16 * k, padding: `${20 * k}px ${40 * k}px`, borderRadius: 16 * k,
          background: "#16a34a", color: "#fff", boxShadow: "0 14px 34px -8px rgba(22,163,74,0.55)",
          opacity: a(0.5), transform: `translateY(${(1 - a(0.5)) * 18}px)`,
        }}>
          <div style={{ fontFamily: FILM_FONT.ui, fontSize: 46 * k, fontWeight: 600, letterSpacing: "-0.01em" }}>{END.url}</div>
          <ArrowRight size={40 * k} />
        </div>
        <div style={{ fontFamily: FILM_FONT.ui, fontSize: 30 * k, fontWeight: 500, color: INK, opacity: 0.85 * a(0.7) }}>{tr("home.hero.cta", "en")}</div>
      </div>
      {/* the honesty line: whole, inside the safe frame, for the length of the card */}
      <div style={{
        position: "absolute", left: layout.safe.x, width: layout.safe.w, bottom: wide ? 40 : layout.height - (layout.safe.y + layout.safe.h) + 18,
        display: "flex", justifyContent: "center",
      }}>
        <div style={{ padding: `${12 * k}px ${26 * k}px`, borderRadius: 999, background: "rgba(255,252,244,0.92)", boxShadow: "0 4px 14px rgba(23,48,42,0.18)", textAlign: "center" }}>
          {END.disclosure[layout.aspect].map((l) => (
            <div key={l} style={{ fontFamily: FILM_FONT.ui, fontSize: wide ? 23 : 27, fontWeight: 500, color: INK, lineHeight: 1.35, whiteSpace: "nowrap" }}>{l}</div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
