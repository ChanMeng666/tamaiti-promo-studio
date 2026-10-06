import React from "react";
import { Lock } from "lucide-react";

import { easeOutCubic, prog } from "../core/ease";
import type { Layout } from "../core/layout-core";
import { END } from "../copy";
import { FILM_FONT } from "../fonts";

/** Entry: the window settles in. The floor keeps the first frame a picture, not a blank. */
const ENTRY_SEC = 0.5;
export const BAR_H = 44;

/**
 * The product window: a browser in 16:9, a phone in 9:16. The replica is drawn
 * in its own design pixels and scaled once here.
 */
export const ProductWindow: React.FC<{ layout: Layout; sec: number; dur: number; path: string; children: React.ReactNode }> = ({ layout, sec, dur, path, children }) => {
  const wide = layout.aspect === "landscape";
  const win = layout.window;
  const e = easeOutCubic(prog(sec, 0, ENTRY_SEC));
  const push = 1 + 0.016 * prog(sec, 0, dur);
  const radius = wide ? 16 : 46;
  const bezel = wide ? 0 : 12;
  return (
    <div style={{
      position: "absolute", left: win.x - bezel, top: win.y - bezel, width: win.w + 2 * bezel, height: win.h + 2 * bezel,
      transform: `translateY(${(1 - e) * 46}px) scale(${(0.972 + 0.028 * e) * push})`, transformOrigin: "50% 60%", opacity: 0.72 + 0.28 * e,
      borderRadius: radius + bezel, background: wide ? "#fff" : "#16201d", padding: bezel, boxSizing: "border-box",
      boxShadow: "0 2px 4px rgba(23,48,42,0.10), 0 18px 40px -8px rgba(23,48,42,0.30), 0 50px 90px -30px rgba(23,48,42,0.38)",
    }}>
      <div style={{ width: win.w, height: win.h, borderRadius: radius, overflow: "hidden", background: "#fff", position: "relative" }}>
        {wide ? (
          <div style={{ height: BAR_H, background: "#f1f1ee", borderBottom: "1px solid #dfdfda", display: "flex", alignItems: "center", padding: "0 18px", gap: 9, boxSizing: "border-box" }}>
            {["#f26b5e", "#f5bd4f", "#5fc454"].map((c) => <div key={c} style={{ width: 13, height: 13, borderRadius: 99, background: c }} />)}
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <div style={{ height: 28, minWidth: 440, borderRadius: 8, background: "#fff", border: "1px solid #e2e2dd", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: FILM_FONT.ui, fontSize: 15, color: "#4a4a45", padding: "0 16px" }}>
                <Lock size={13} color="#7a7a74" />
                <span>{END.url}{path}</span>
              </div>
            </div>
            <div style={{ width: 57 }} />
          </div>
        ) : null}
        <div style={{ width: layout.design.w, height: layout.design.h, transform: `scale(${layout.unit})`, transformOrigin: "0 0", fontFamily: FILM_FONT.ui }}>
          {children}
        </div>
      </div>
    </div>
  );
};
