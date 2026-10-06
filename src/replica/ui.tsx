/**
 * The replica's building blocks: the product's shadcn primitives, redrawn with
 * inline styles in the replica's own design pixels.
 *
 * Laws of this directory:
 *   - everything is a pure function of its props. No hooks, no effects, no
 *     state, no clocks, no randomness.
 *   - no CSS transition / animation / keyframes anywhere: they run on the wall
 *     clock, and a frame renderer paints frame 900 before frame 12.
 *   - no `will-change`.
 */

import React from "react";
import {
  BookOpen, ClipboardCheck, Languages, Library, Menu, Mic, Moon as MoonIcon, Target, Users,
} from "lucide-react";

import { clamp01, easeInOutCubic, lerp, prog } from "../core/ease";
import product from "./data/product.generated.json";
import { DEMO } from "./demo";
import { h, type Lang } from "./strings";
import { C, shadow } from "./tokens";

export type CSS = React.CSSProperties;
export interface ScreenProps { t: number; mobile: boolean }

export const FONT = `Inter, ui-sans-serif, system-ui, "Segoe UI", sans-serif`;
export const EMOJI = `"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;

/** Piecewise keyframes with an ease between each pair: [[time, value], …]. */
export const kf = (t: number, keys: readonly (readonly [number, number])[], ease = easeInOutCubic): number => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1];
      const [t1, v1] = keys[i];
      return lerp(v0, v1, ease(prog(t, t0, t1)));
    }
  }
  return keys[keys.length - 1][1];
};

export const Row: React.FC<{ gap?: number; align?: CSS["alignItems"]; justify?: CSS["justifyContent"]; style?: CSS; children?: React.ReactNode }> =
  ({ gap = 0, align = "center", justify, style, children }) => (
    <div style={{ display: "flex", flexDirection: "row", alignItems: align, justifyContent: justify, gap, ...style }}>{children}</div>
  );

export const Col: React.FC<{ gap?: number; style?: CSS; children?: React.ReactNode }> = ({ gap = 0, style, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap, ...style }}>{children}</div>
);

export const T: React.FC<{ size?: number; weight?: number; color?: string; lh?: number; italic?: boolean; style?: CSS; children?: React.ReactNode }> =
  ({ size = 14, weight = 400, color = C.fg, lh = 1.45, italic, style, children }) => (
    <div style={{ fontSize: size, fontWeight: weight, color, lineHeight: lh, fontStyle: italic ? "italic" : undefined, ...style }}>{children}</div>
  );

/** shadcn Card: rounded-xl border shadow-sm. */
export const Card: React.FC<{ style?: CSS; pad?: number; children?: React.ReactNode }> = ({ style, pad = 24, children }) => (
  <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: shadow.sm, padding: pad, boxSizing: "border-box", ...style }}>
    {children}
  </div>
);

type Variant = "default" | "outline" | "ghost" | "secondary" | "destructive";
export const Button: React.FC<{ variant?: Variant; h?: number; px?: number; size?: number; pressed?: number; style?: CSS; children?: React.ReactNode }> =
  ({ variant = "default", h: height = 36, px = 16, size = 14, pressed = 0, style, children }) => {
    const look: Record<Variant, CSS> = {
      default: { background: C.primary, color: C.primaryFg },
      outline: { background: C.bg, color: C.fg, border: `1px solid ${C.border}`, boxShadow: shadow.xs },
      ghost: { background: "transparent", color: C.fg },
      secondary: { background: C.muted, color: C.fg },
      destructive: { background: C.destructive, color: "#fff" },
    };
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height, padding: `0 ${px}px`,
        borderRadius: 8, fontSize: size, fontWeight: 500, whiteSpace: "nowrap", boxSizing: "border-box",
        transform: `scale(${1 - 0.04 * pressed})`, filter: pressed > 0 ? `brightness(${1 - 0.08 * pressed})` : undefined,
        ...look[variant], ...style,
      }}>{children}</div>
    );
  };

export const Badge: React.FC<{ bg?: string; color?: string; border?: string; size?: number; style?: CSS; children?: React.ReactNode }> =
  ({ bg = C.muted, color = C.fg, border = "transparent", size = 12, style, children }) => (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 8, fontSize: size, fontWeight: 500,
      background: bg, color, border: `1px solid ${border}`, whiteSpace: "nowrap", lineHeight: 1.4, ...style,
    }}>{children}</div>
  );

/** shadcn Progress: track bg-primary/20, indicator bg-primary. */
export const Progress: React.FC<{ value: number; h?: number; color?: string; style?: CSS }> = ({ value, h: height = 8, color = C.primary, style }) => (
  <div style={{ height, borderRadius: 999, background: `${color}33`, overflow: "hidden", ...style }}>
    <div style={{ width: `${clamp01(value / 100) * 100}%`, height: "100%", background: color, borderRadius: 999 }} />
  </div>
);

/** shadcn Switch. `on` is 0…1 so the thumb can be drawn mid-travel. */
export const Switch: React.FC<{ on: number }> = ({ on }) => (
  <div style={{ width: 32, height: 18, borderRadius: 999, background: on > 0.5 ? C.primary : "#d4d4d4", position: "relative", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: 1, left: 1 + 14 * clamp01(on), width: 16, height: 16, borderRadius: 999, background: "#fff", boxShadow: shadow.xs }} />
  </div>
);

/** shadcn Slider; `value` in [0,1]. */
export const Slider: React.FC<{ value: number; active?: boolean }> = ({ value, active }) => (
  <div style={{ position: "relative", height: 16 }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 5, height: 6, borderRadius: 999, background: C.muted }} />
    <div style={{ position: "absolute", left: 0, width: `${clamp01(value) * 100}%`, top: 5, height: 6, borderRadius: 999, background: C.primary }} />
    <div style={{
      position: "absolute", left: `calc(${clamp01(value) * 100}% - 8px)`, top: 0, width: 16, height: 16, borderRadius: 999, boxSizing: "border-box",
      background: C.bg, border: `1px solid ${C.primary}`, boxShadow: active ? `0 0 0 4px ${C.primary}33` : shadow.sm,
    }} />
  </div>
);

/** A moon phase, from the product's own SVG markup for that lunar day. */
export const Moon: React.FC<{ day: number; size: number; style?: CSS }> = ({ day, size, style }) => (
  <svg viewBox="0 0 50 50" width={size} height={size} style={{ display: "block", flexShrink: 0, ...style }}
    dangerouslySetInnerHTML={{ __html: (product.maramataka.moons as Record<string, string>)[String(day)] ?? "" }} />
);

export const Avatar: React.FC<{ initials: string; size?: number }> = ({ initials, size = 40 }) => (
  <div style={{
    width: size, height: size, borderRadius: 999, background: `${C.primary}1a`, color: C.primary, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 600,
  }}>{initials}</div>
);

/** The pointer: an arrow on desktop, a touch dot on a phone. `press` is 0…1. */
export const Cursor: React.FC<{ x: number; y: number; press?: number; mobile: boolean; opacity?: number }> = ({ x, y, press = 0, mobile, opacity = 1 }) =>
  mobile ? (
    <div style={{
      position: "absolute", left: x - 17, top: y - 17, width: 34, height: 34, borderRadius: 999, opacity: opacity * 0.9, zIndex: 50,
      background: "rgba(23,23,23,0.22)", border: "2px solid rgba(255,255,255,0.9)", boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
      transform: `scale(${1 - 0.22 * press})`,
    }} />
  ) : (
    <svg width={22} height={26} viewBox="0 0 22 26" style={{ position: "absolute", left: x - 3, top: y - 2, opacity, zIndex: 50, transform: `scale(${1 - 0.14 * press})`, transformOrigin: "3px 2px", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.35))" }}>
      <path d="M3 2 L3 20 L8 15.5 L11.4 23.2 L14.4 21.9 L11 14.4 L18 14.2 Z" fill="#111" stroke="#fff" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );

/** A click's ring, expanding from the point for a moment after `at`. */
export const ClickRing: React.FC<{ x: number; y: number; t: number; at: number }> = ({ x, y, t, at }) => {
  const p = prog(t, at, at + 0.45);
  if (p <= 0 || p >= 1) return null;
  const r = 6 + 20 * p;
  return <div style={{ position: "absolute", left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: 999, border: `2px solid ${C.primary}`, opacity: 1 - p, zIndex: 49 }} />;
};

/** How pressed a button is around a click at `at`. */
export const pressAt = (t: number, at: number): number => (t < at - 0.08 || t > at + 0.16 ? 0 : t < at ? prog(t, at - 0.08, at) : 1 - prog(t, at, at + 0.16));

// ── the two page headers ──────────────────────────────────────────────────────

const NAV = [
  { key: "navGoals", Icon: Target, id: "goals" },
  { key: "navJournal", Icon: BookOpen, id: "journal" },
  { key: "navCoach", Icon: Mic, id: "coach" },
  { key: "navMaramataka", Icon: MoonIcon, id: "maramataka" },
  { key: "navAssessment", Icon: ClipboardCheck, id: "assessment" },
  { key: "navSupport", Icon: Users, id: "support" },
  { key: "navResources", Icon: Library, id: "resources" },
] as const;

export const LangToggle: React.FC<{ lang: Lang; pressed?: number }> = ({ lang, pressed = 0 }) => (
  <Button variant="ghost" h={36} px={10} pressed={pressed} style={{ gap: 6, background: pressed > 0 ? C.muted : "transparent" }}>
    <Languages size={16} />
    <span style={{ fontSize: 12, fontWeight: 500 }}>{lang === "mi" ? "MI" : "EN"}</span>
  </Button>
);

/** GlobalHeader: the signed-in app's top bar (h-16). The nav hides below md. */
export const AppHeader: React.FC<{ mobile: boolean; lang: Lang; active?: string; togglePressed?: number }> = ({ mobile, lang, active, togglePressed }) => (
  <div style={{
    height: 64, borderBottom: `1px solid ${C.border}`, background: "rgba(255,255,255,0.95)", boxSizing: "border-box",
    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", flexShrink: 0,
  }}>
    <Row gap={mobile ? 24 : 18}>
      <T size={20} weight={600} style={{ whiteSpace: "nowrap" }}>{h("appName")}</T>
      {mobile ? null : (
        <Row gap={0}>
          {NAV.map(({ key, Icon, id }) => (
            <div key={id} style={{
              display: "inline-flex", alignItems: "center", gap: 6, height: 36, padding: "0 7px", borderRadius: 8, fontSize: 13, fontWeight: 500, whiteSpace: "nowrap",
              background: active === id ? C.muted : "transparent",
            }}>
              <Icon size={16} />
              <span>{h(key)}</span>
            </div>
          ))}
        </Row>
      )}
    </Row>
    <Row gap={mobile ? 8 : 10} style={{ flexShrink: 0 }}>
      <LangToggle lang={lang} pressed={togglePressed} />
      {mobile ? null : (
        <Col style={{ alignItems: "flex-end" }}>
          <T size={13} weight={500} lh={1.25} style={{ whiteSpace: "nowrap" }}>{DEMO.user.name}</T>
          <T size={11} color={C.mutedFg} lh={1.25}>{DEMO.user.email}</T>
        </Col>
      )}
      <Avatar initials={DEMO.user.initials} size={mobile ? 36 : 40} />
      {mobile ? <Menu size={20} /> : null}
    </Row>
  </div>
);

/** PublicHeader, variant "page": the brand bar plus a page title strip. */
export const PublicPageHeader: React.FC<{ mobile: boolean; lang: Lang; title: string; icon: React.ReactNode; action?: React.ReactNode }> = ({ mobile, lang, title, icon, action }) => (
  <div style={{ flexShrink: 0 }}>
    <div style={{
      height: 72, borderBottom: `1px solid ${C.border}`, boxSizing: "border-box", display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: mobile ? "0 16px" : "0 32px", background: "rgba(255,255,255,0.95)",
    }}>
      <Row gap={8}>
        <MoonIcon size={24} color={C.green[600]} />
        <T size={20} weight={700}>{h("publicName")}</T>
      </Row>
      <Row gap={mobile ? 8 : 16}>
        {mobile ? null : <T size={14} weight={500} style={{ padding: "0 12px" }}>{h("navMaramataka")}</T>}
        <LangToggle lang={lang} />
        {mobile ? <Menu size={20} /> : null}
      </Row>
    </div>
    <Row justify="space-between" style={{ padding: mobile ? "16px 16px" : "22px 32px" }}>
      <Row gap={10}>
        {icon}
        <T size={mobile ? 24 : 30} weight={700} lh={1.2}>{title}</T>
      </Row>
      {action}
    </Row>
  </div>
);

/** The scrolling page area under a fixed header. `scroll` is in design px. */
export const Page: React.FC<{ scroll?: number; bg?: string; children?: React.ReactNode }> = ({ scroll = 0, bg = C.bg, children }) => (
  <div style={{ position: "relative", flex: 1, overflow: "hidden", background: bg }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, transform: `translateY(${-scroll}px)` }}>{children}</div>
  </div>
);

/** The screen root: the product's font, colour and box model on a fixed viewport. */
export const Screen: React.FC<{ w: number; h: number; children?: React.ReactNode }> = ({ w, h: height, children }) => (
  <div style={{
    width: w, height, position: "relative", overflow: "hidden", background: C.bg, color: C.fg, fontFamily: FONT,
    display: "flex", flexDirection: "column", WebkitFontSmoothing: "antialiased", textRendering: "optimizeLegibility",
  }}>{children}</div>
);
