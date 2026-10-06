/**
 * The deliverables table and the per-aspect layout. React-free, so the gates
 * can execute it in Node.
 */

export const FPS = 30;

export type CutId = "15" | "30" | "60";
export const CUT_IDS: readonly CutId[] = ["15", "30", "60"];
export const CUT_SECONDS: Readonly<Record<CutId, number>> = { "15": 15, "30": 30, "60": 60 };

export type Aspect = "landscape" | "portrait";
export const SHAPES: Readonly<Record<Aspect, { width: number; height: number }>> = {
  landscape: { width: 1920, height: 1080 },
  portrait: { width: 1080, height: 1920 },
};

export interface Deliverable { id: string; cut: CutId; aspect: Aspect; width: number; height: number; file: string }

export const DELIVERABLES: readonly Deliverable[] = CUT_IDS.flatMap((cut) =>
  (Object.keys(SHAPES) as Aspect[]).map((aspect) => {
    const { width, height } = SHAPES[aspect];
    return {
      id: `Tamaiti-${cut}-${aspect === "landscape" ? "Landscape" : "Vertical"}`,
      cut, aspect, width, height,
      file: `tam-ai-ti_${cut}s_${aspect === "landscape" ? "landscape" : "vertical"}_${width}x${height}.mp4`,
    };
  }),
);

export interface Rect { x: number; y: number; w: number; h: number }

export interface Layout {
  width: number;
  height: number;
  aspect: Aspect;
  /** where a sentence may be set: platform chrome owns the rest in 9:16 */
  safe: Rect;
  /** the product window: a browser in 16:9, a phone in 9:16 */
  window: Rect;
  /** the replica's own design viewport, in CSS px before scaling */
  design: { w: number; h: number };
  /** film px per replica design px */
  unit: number;
  /** the caption block */
  caption: Rect;
  captionSize: number;
  /** film furniture scale: 1 at 1080 on the short edge */
  s: number;
}

const SAFE = {
  landscape: { top: 64, bottom: 64, side: 110 },
  // Reels / Shorts / TikTok cover roughly the top 250 px and the bottom 390 px
  portrait: { top: 250, bottom: 390, side: 84 },
} as const;

export const deriveLayout = (width: number, height: number): Layout => {
  const aspect: Aspect = width >= height ? "landscape" : "portrait";
  const m = SAFE[aspect];
  const safe: Rect = { x: m.side, y: m.top, w: width - 2 * m.side, h: height - m.top - m.bottom };
  if (aspect === "landscape") {
    // browser window on top, one caption line under it
    const design = { w: 1024, h: 576 };
    const chrome = 44; // browser bar, in film px
    const w = 1408;
    const unit = w / design.w;
    const h = design.h * unit + chrome;
    const window: Rect = { x: (width - w) / 2, y: 50, w, h };
    const caption: Rect = { x: safe.x, y: window.y + window.h + 26, w: safe.w, h: height - (window.y + window.h + 26) - 36 };
    return { width, height, aspect, safe, window, design, unit, caption, captionSize: 46, s: 1 };
  }
  // caption on top, the phone under it; the phone may run past the type-safe line
  const design = { w: 390, h: 540 };
  const w = 836;
  const unit = w / design.w;
  const h = design.h * unit;
  const caption: Rect = { x: safe.x, y: safe.y, w: safe.w, h: 190 };
  const window: Rect = { x: (width - w) / 2, y: caption.y + caption.h + 24, w, h };
  return { width, height, aspect, safe, window, design, unit, caption, captionSize: 60, s: 1 };
};
