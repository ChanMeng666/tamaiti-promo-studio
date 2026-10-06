"""Procedural watercolour plates for the TAM-AI-TI film.

No SVG, no generated imagery: every plate is painted by code. The engine models
transparent watercolour the way pigment actually behaves on paper:

  * paint is stored as OPTICAL DENSITY per channel, so overlapping glazes
    multiply (a blue over a yellow goes green, a second coat goes darker);
  * pigment settles in the paper's valleys (granulation), pools at the edge of
    a drying wash (edge darkening) and creeps where the paper is wet (blooms);
  * shapes are never a clean polygon -- the mask is warped by noise first;
  * ink lines carry pressure: thickness and darkness vary along the stroke,
    with a taper at both ends and a little hand tremor.

Each scene is split into depth layers. Hill layers are saved as "pigment on
white" and composited in the browser with multiply, which is the same maths as
a glaze. The moon, the sun and the water glints are light, so they are saved
with alpha and composited normally.

Deterministic: every random draw comes from a seeded generator, so a rebuild is
a re-render, not a re-roll.

    python art/paint.py            # paint everything into public/art/
    python art/paint.py --only night
"""

from __future__ import annotations

import argparse
import os
import sys

import cv2
import numpy as np
from PIL import Image

W, H = 2600, 2000          # plate size: wide enough for 16:9 parallax, tall enough for 9:16
HORIZON = 1180             # y of the sea horizon on the plate
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "art")


# ── noise ────────────────────────────────────────────────────────────────────

def rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


def value_noise(h: int, w: int, cell: float, seed: int, stretch: float = 1.0) -> np.ndarray:
    """Smooth noise in [0,1]. `stretch` > 1 elongates it horizontally (brush drag)."""
    gh = max(2, int(h / cell) + 2)
    gw = max(2, int(w / (cell * stretch)) + 2)
    g = rng(seed).random((gh, gw)).astype(np.float32)
    return cv2.resize(g, (w, h), interpolation=cv2.INTER_CUBIC).clip(0, 1)


def fbm(h: int, w: int, cell: float, seed: int, octaves: int = 4, stretch: float = 1.0) -> np.ndarray:
    out = np.zeros((h, w), np.float32)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        out += amp * value_noise(h, w, max(1.5, cell / (2 ** o)), seed + 101 * o, stretch)
        total += amp
        amp *= 0.5
    return out / total


def blur(a: np.ndarray, sigma: float) -> np.ndarray:
    if sigma <= 0:
        return a
    return cv2.GaussianBlur(a, (0, 0), sigma)


def smoothstep(a: float, b: float, x: np.ndarray) -> np.ndarray:
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


# ── paper ────────────────────────────────────────────────────────────────────

class Paper:
    """Cold-pressed paper: a height field (tooth) plus a faint warm tone."""

    def __init__(self, h: int, w: int, seed: int = 7):
        self.h, self.w = h, w
        grain = fbm(h, w, 5.0, seed, 3)
        fibre = fbm(h, w, 2.2, seed + 9, 2, stretch=3.0)
        self.height = (0.65 * grain + 0.35 * fibre)
        self.height = (self.height - self.height.min()) / (np.ptp(self.height) + 1e-6)
        tone = np.array([0.975, 0.962, 0.935], np.float32)
        shade = 1.0 - 0.045 * (1.0 - self.height)
        self.rgb = tone[None, None, :] * shade[:, :, None]


# ── the wash ─────────────────────────────────────────────────────────────────

def hex_rgb(s: str) -> np.ndarray:
    s = s.lstrip("#")
    return np.array([int(s[i:i + 2], 16) / 255.0 for i in (0, 2, 4)], np.float32)


class Sheet:
    """One sheet (or one depth layer) accumulating pigment as optical density."""

    def __init__(self, paper: Paper, seed: int):
        self.p = paper
        self.h, self.w = paper.h, paper.w
        self.D = np.zeros((self.h, self.w, 3), np.float32)
        self.seed = seed
        self._n = 0

    def _next(self) -> int:
        self._n += 1
        return self.seed * 1000 + self._n * 37

    def warp(self, mask: np.ndarray, amount: float, cell: float = 60.0) -> np.ndarray:
        """Wobble a mask's outline: a hand-held brush never follows the pencil line."""
        if amount <= 0:
            return mask
        s = self._next()
        dx = (fbm(self.h, self.w, cell, s, 3) - 0.5) * 2 * amount
        dy = (fbm(self.h, self.w, cell, s + 5, 3) - 0.5) * 2 * amount
        yy, xx = np.mgrid[0:self.h, 0:self.w].astype(np.float32)
        return cv2.remap(mask, xx + dx, yy + dy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)

    def glaze(self, mask: np.ndarray, colour: str | np.ndarray, strength: float = 1.0, *,
              wobble: float = 6.0, soft: float = 1.6, edge: float = 0.35, edge_w: float = 7.0,
              granulate: float = 0.35, bloom: float = 0.3, bloom_cell: float = 260.0,
              wet: float = 0.0) -> None:
        """Lay one transparent wash.

        mask      float [0,1], where the brush touched
        strength  pigment load (1 = the colour as given, 2 = a second coat)
        edge      extra pigment pooled at the drying edge
        granulate how strongly pigment settles into the paper's valleys
        bloom     large soft back-runs inside the wash
        wet       wet-in-wet: the wash diffuses outward by this many px
        """
        c = hex_rgb(colour) if isinstance(colour, str) else colour
        absorb = -np.log(np.clip(c, 0.02, 0.999))
        m = self.warp(mask.astype(np.float32), wobble)
        if wet > 0:
            # diffusion is uneven: it follows the damp, not a compass
            damp = fbm(self.h, self.w, wet * 3, self._next(), 3)
            m = blur(m, wet) * (0.75 + 0.5 * damp)
            m = np.clip(m, 0, 1)
        m = blur(m, soft)
        rim = np.clip(m - blur(m, edge_w), 0, 1) * 2.2          # just inside the outline
        back = fbm(self.h, self.w, bloom_cell, self._next(), 4)
        load = m * (1.0 + bloom * (back - 0.5) * 2)
        load *= 1.0 + granulate * (0.5 - self.p.height) * 2      # valleys take more pigment
        load += edge * rim
        self.D += absorb[None, None, :] * (strength * np.clip(load, 0, None))[:, :, None]

    def lift(self, mask: np.ndarray, amount: float = 0.8, soft: float = 2.0) -> None:
        """Lift pigment back off (a damp brush, or wax resist): how watercolour makes light."""
        m = blur(mask.astype(np.float32), soft)
        self.D *= (1.0 - amount * np.clip(m, 0, 1))[:, :, None]

    def ink(self, pts: np.ndarray, width: float = 2.4, colour: str = "#1c2430", darkness: float = 1.0,
            tremor: float = 0.8, dry: float = 0.25) -> None:
        """A pen line with pressure: tapered ends, varying weight, a slight tremor."""
        n = len(pts)
        if n < 2:
            return
        r = rng(self._next())
        t = np.linspace(0, 1, n)
        pressure = np.sin(np.pi * t) ** 0.45                        # lands, presses, lifts
        wander = np.interp(t, np.linspace(0, 1, 9), r.uniform(0.6, 1.15, 9))
        wdt = np.clip(width * pressure * wander, 0.5, None)
        jit = np.cumsum(r.normal(0, tremor * 0.18, (n, 2)), axis=0)
        jit -= np.linspace(0, 1, n)[:, None] * jit[-1]              # ends stay where aimed
        p = pts + jit
        x0, y0 = np.floor(p.min(0) - width * 3).astype(int)
        x1, y1 = np.ceil(p.max(0) + width * 3).astype(int)
        x0, y0 = max(x0, 0), max(y0, 0)
        x1, y1 = min(x1, self.w), min(y1, self.h)
        if x1 <= x0 or y1 <= y0:
            return
        S = 4                                                       # supersample for a clean nib
        canvas = np.zeros(((y1 - y0) * S, (x1 - x0) * S), np.uint8)
        q = ((p - [x0, y0]) * S).astype(np.int32)
        for i in range(n - 1):
            cv2.line(canvas, tuple(q[i]), tuple(q[i + 1]), 255,
                     max(1, int(round(wdt[i] * S))), cv2.LINE_AA)
        m = cv2.resize(canvas, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
        # a fast stroke skips the paper's valleys
        tooth = self.p.height[y0:y1, x0:x1]
        m *= 1.0 - dry * smoothstep(0.35, 0.0, tooth)
        absorb = -np.log(np.clip(hex_rgb(colour), 0.02, 0.999))
        self.D[y0:y1, x0:x1] += absorb[None, None, :] * (darkness * m)[:, :, None]

    def rgb(self, on_white: bool = False) -> np.ndarray:
        base = np.ones_like(self.p.rgb) if on_white else self.p.rgb
        return np.clip(base * np.exp(-self.D), 0, 1)


def save_rgb(path: str, rgb: np.ndarray, quality: int = 90) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    Image.fromarray((rgb * 255 + 0.5).astype(np.uint8), "RGB").save(path, "WEBP", quality=quality, method=6)
    print(f"  wrote {os.path.relpath(path, OUT)}  {os.path.getsize(path) / 1024:.0f} KB")


def save_rgba(path: str, rgb: np.ndarray, alpha: np.ndarray, quality: int = 92) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    a = np.dstack([rgb, np.clip(alpha, 0, 1)[:, :, None]])
    Image.fromarray((a * 255 + 0.5).astype(np.uint8), "RGBA").save(path, "WEBP", quality=quality, method=6)
    print(f"  wrote {os.path.relpath(path, OUT)}  {os.path.getsize(path) / 1024:.0f} KB")


# ── shapes ───────────────────────────────────────────────────────────────────

def ridge(seed: int, base: float, amp: float, cell: float, peaks: list[tuple[float, float, float]] = ()) -> np.ndarray:
    """A skyline: y for every x. `peaks` adds (x, height, half-width) summits."""
    x = np.arange(W, dtype=np.float32)
    n = fbm(1, W, cell, seed, 5)[0]
    fine = fbm(1, W, cell / 9, seed + 3, 3)[0]
    y = base - amp * (n - 0.35) - amp * 0.12 * (fine - 0.5)
    for px, ph, pw in peaks:
        d = np.abs(x - px) / pw
        y -= ph * np.exp(-(d ** 1.6))                               # a concave, cone-like flank
    return y


def below(y_line: np.ndarray) -> np.ndarray:
    yy = np.arange(H, dtype=np.float32)[:, None]
    return (yy >= y_line[None, :]).astype(np.float32)


def ridge_pts(y_line: np.ndarray, x0: int, x1: int, step: int = 6) -> np.ndarray:
    xs = np.arange(x0, x1, step)
    return np.stack([xs, y_line[xs]], axis=1).astype(np.float32)


def bezier(p0, p1, p2, n: int = 40) -> np.ndarray:
    t = np.linspace(0, 1, n)[:, None]
    return ((1 - t) ** 2) * np.array(p0) + 2 * (1 - t) * t * np.array(p1) + (t ** 2) * np.array(p2)


def blade_mask(mask: np.ndarray, base, tip, bend: float, width: float) -> np.ndarray:
    """One harakeke (flax) blade: a tapered leaf drawn as a filled polygon, in place."""
    mid = ((base[0] + tip[0]) / 2 + bend, (base[1] + tip[1]) / 2)
    c = bezier(base, mid, tip, 26)
    d = np.gradient(c, axis=0)
    nrm = np.stack([-d[:, 1], d[:, 0]], 1)
    nrm /= (np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-6)
    t = np.linspace(0, 1, len(c))
    w = width * (np.sin(np.pi * np.clip(t * 0.92 + 0.08, 0, 1)) ** 0.7) * (1 - t * 0.55)
    poly = np.concatenate([c + nrm * w[:, None], (c - nrm * w[:, None])[::-1]]).astype(np.int32)
    cv2.fillPoly(mask, [poly], 1.0, cv2.LINE_AA)
    return c


# ── the landscape ────────────────────────────────────────────────────────────

PALETTES = {
    # te pō — the night the maramataka is read by
    "night": dict(
        sky_top="#1d2b55", sky_mid="#2c4f7c", sky_low="#6fa3ad", glow="#f3e3b4",
        far="#8fa3cf", mid="#5f86a8", near="#2f6b63", near2="#17463f",
        sea="#3f7f98", sea2="#27567a", ink="#141c2b", flax="#1f5a4a",
    ),
    # te ata — first light
    "dawn": dict(
        sky_top="#9cc3de", sky_mid="#f3c7a4", sky_low="#fbe2a6", glow="#fff1c9",
        far="#b9b5dc", mid="#8fbfae", near="#3f9b74", near2="#157a55",
        sea="#8cc4cf", sea2="#5fa3b8", ink="#22313a", flax="#0f6b4a",
    ),
}


def paint_scene(name: str) -> None:
    pal = PALETTES[name]
    night = name == "night"
    print(f"scene: {name}")
    paper = Paper(H, W, seed=11)
    yy = np.linspace(0, 1, H, dtype=np.float32)[:, None] * np.ones((1, W), np.float32)
    seed0 = 400 if night else 900

    # 1 ── sky: three graded washes laid wet-in-wet, top to horizon
    sky = Sheet(paper, seed0 + 1)
    hz = HORIZON / H
    sky.glaze(smoothstep(hz * 0.95, 0.0, yy), pal["sky_top"], 1.25 if night else 0.9,
              wobble=30, soft=30, edge=0.0, bloom=0.45, bloom_cell=420, granulate=0.3)
    sky.glaze(smoothstep(0.0, hz * 0.55, yy) * smoothstep(hz * 1.05, hz * 0.5, yy), pal["sky_mid"],
              0.95 if night else 0.75, wobble=40, soft=40, edge=0.0, bloom=0.5, bloom_cell=360, granulate=0.28)
    sky.glaze(smoothstep(hz * 0.55, hz * 1.02, yy), pal["sky_low"], 0.8 if night else 0.85,
              wobble=40, soft=36, edge=0.0, bloom=0.4, bloom_cell=300, granulate=0.25)
    # cloud bands: damp horizontal strokes that dried with a hard lower edge
    r = rng(seed0 + 2)
    for i in range(7 if night else 9):
        cy = r.uniform(0.16, hz * 0.9) * H
        cx = r.uniform(0.05, 0.95) * W
        band = fbm(H, W, 150, seed0 + 20 + i, 4, stretch=5.0)
        y_, x_ = np.mgrid[0:H, 0:W].astype(np.float32)
        env = np.exp(-(((y_ - cy) / r.uniform(26, 60)) ** 2) - (((x_ - cx) / r.uniform(380, 900)) ** 2))
        m = smoothstep(0.50, 0.62, band) * env
        if night:
            sky.glaze(m, pal["sky_top"], 0.55, wobble=12, soft=5, edge=0.5, edge_w=9, bloom=0.3)
        else:
            sky.lift(m, 0.55, soft=7)
            sky.glaze(m * 0.6, "#f2a98e", 0.35, wobble=12, soft=6, edge=0.4, edge_w=9)
    if night:
        # stars: masking-fluid dots lifted back to paper
        stars = np.zeros((H, W), np.float32)
        for _ in range(520):
            x, y = int(r.uniform(0, W)), int(r.uniform(0, HORIZON * 0.9))
            cv2.circle(stars, (x, y), int(r.choice([1, 1, 1, 2, 2, 3])), 1.0, -1, cv2.LINE_AA)
        sky.lift(stars, 0.93, soft=0.9)
    # the light behind the horizon
    y_, x_ = np.mgrid[0:H, 0:W].astype(np.float32)
    glow = np.exp(-(((x_ - W * 0.5) / (W * 0.33)) ** 2) - (((y_ - HORIZON) / 210) ** 2))
    sky.lift(glow, 0.5 if night else 0.62, soft=12)
    sky.glaze(glow * 0.5, pal["glow"], 0.45, wobble=20, soft=22, edge=0.0, bloom=0.3)
    # below the horizon the sheet is left as sea-toned underpainting
    sky.glaze(smoothstep(hz - 0.004, hz + 0.004, yy), pal["sea"], 0.9 if night else 0.55,
              wobble=3, soft=2.2, edge=0.25, bloom=0.35, bloom_cell=300)
    save_rgb(os.path.join(OUT, name, "sky.webp"), sky.rgb())

    # 2 ── far range: one pale wash, a second coat in the shadowed gullies
    far_y = ridge(seed0 + 31, HORIZON - 70, 150, 520,
                  peaks=[(W * 0.70, 235, 250), (W * 0.20, 120, 300)])
    far = Sheet(paper, seed0 + 3)
    fm = below(far_y) * (1 - smoothstep(HORIZON - 8, HORIZON + 6, yy * H))
    far.glaze(fm, pal["far"], 0.85, wobble=5, soft=1.4, edge=0.4, edge_w=8, bloom=0.5, bloom_cell=220)
    gul = smoothstep(0.52, 0.66, fbm(H, W, 90, seed0 + 33, 4)) * fm
    far.glaze(gul, pal["far"], 0.45, wobble=8, soft=3, edge=0.25, wet=6)
    # snow on the cone: lifted while damp
    cone = np.exp(-(((x_ - W * 0.70) / 150) ** 2)) * smoothstep(far_y.min() + 150, far_y.min(), y_) * fm
    far.lift(cone * smoothstep(0.35, 0.6, fbm(H, W, 40, seed0 + 34, 3)), 0.75, soft=2.5)
    for a, b in [(0, 900), (980, 1700), (1760, W)]:
        far.ink(ridge_pts(far_y, a, b), width=1.9, colour=pal["ink"], darkness=0.5, tremor=0.9)
    save_rgb(os.path.join(OUT, name, "far.webp"), far.rgb(on_white=True))

    # 3 ── middle hills
    mid_y = ridge(seed0 + 41, HORIZON - 6, 120, 420, peaks=[(W * 0.08, 150, 330), (W * 0.93, 190, 380)])
    # the bay stays open in the middle so the water reads
    open_bay = np.exp(-(((np.arange(W) - W * 0.5) / (W * 0.24)) ** 2)).astype(np.float32)
    mid_y = mid_y + open_bay * 120
    mid = Sheet(paper, seed0 + 4)
    mm = below(mid_y) * (1 - smoothstep(HORIZON + 30, HORIZON + 60, yy * H))
    mid.glaze(mm, pal["mid"], 1.0, wobble=7, soft=1.5, edge=0.45, edge_w=9, bloom=0.5, bloom_cell=200)
    bush = smoothstep(0.5, 0.6, fbm(H, W, 46, seed0 + 43, 4)) * mm
    mid.glaze(bush, pal["near"], 0.55, wobble=6, soft=2.4, edge=0.4, edge_w=5)
    for a, b in [(0, 760), (1840, W)]:
        mid.ink(ridge_pts(mid_y, a, b), width=2.3, colour=pal["ink"], darkness=0.65)
    save_rgb(os.path.join(OUT, name, "mid.webp"), mid.rgb(on_white=True))

    # 4 ── water: dragged horizontal strokes, darker toward the viewer
    sea = Sheet(paper, seed0 + 5)
    sm = smoothstep(HORIZON - 2, HORIZON + 3, yy * H)
    depth = smoothstep(HORIZON, H, yy * H)
    sea.glaze(sm * (0.35 + 0.65 * depth), pal["sea2"], 0.8, wobble=2, soft=2, edge=0.0, bloom=0.4, bloom_cell=260)
    for i, (cell, st, th) in enumerate([(26, 9.0, 0.56), (40, 12.0, 0.6), (70, 14.0, 0.62)]):
        drag = smoothstep(th, th + 0.07, fbm(H, W, cell, seed0 + 51 + i, 3, stretch=st)) * sm
        sea.glaze(drag * (0.4 + 0.6 * depth), pal["sea"], 0.5, wobble=1.5, soft=1.2, edge=0.5, edge_w=4, bloom=0.2)
    save_rgb(os.path.join(OUT, name, "sea.webp"), sea.rgb(on_white=True))

    # glints: the path of light on the water (light, so it carries alpha)
    r = rng(seed0 + 6)
    gl = np.zeros((H, W), np.float32)
    for _ in range(360):
        t = r.uniform(0, 1) ** 1.4
        y = HORIZON + 8 + t * (H - HORIZON - 260)
        spread = 30 + t * 330
        x = W * 0.5 + r.normal(0, spread)
        ln = r.uniform(14, 44) * (0.6 + t * 1.8)
        cv2.ellipse(gl, (int(x), int(y)), (int(ln), max(1, int(1.5 + t * 3.5))), 0, 0, 360,
                    float(r.uniform(0.45, 1.0)), -1, cv2.LINE_AA)
    gl = blur(gl, 1.1) * (0.75 + 0.5 * paper.height)
    save_rgba(os.path.join(OUT, name, "glints.webp"),
              np.ones((H, W, 3), np.float32) * hex_rgb(pal["glow"])[None, None, :], gl * 0.9)

    # 5 ── foreground: a dark headland with harakeke and tī kōuka in pen and wash
    near_y = ridge(seed0 + 61, HORIZON + 420, 190, 620)
    dip = np.exp(-(((np.arange(W) - W * 0.5) / (W * 0.30)) ** 2)).astype(np.float32)
    near_y = near_y + dip * 250 - (1 - dip) * 60
    near = Sheet(paper, seed0 + 7)
    nm = below(near_y)
    near.glaze(nm, pal["near"], 1.25, wobble=9, soft=1.6, edge=0.5, edge_w=10, bloom=0.55, bloom_cell=240)
    tuss = smoothstep(0.48, 0.58, fbm(H, W, 34, seed0 + 63, 4, stretch=0.5)) * nm
    near.glaze(tuss, pal["near2"], 0.9, wobble=6, soft=2, edge=0.45, edge_w=5)
    near.glaze(nm * smoothstep(near_y.min(), H, yy * H), pal["near2"], 0.9, wobble=4, soft=6, edge=0, wet=10)

    r = rng(seed0 + 8)
    # harakeke: fans of blades from clumps along both flanks
    clumps = [(180, 1.25), (470, 0.9), (760, 0.7), (1890, 0.75), (2170, 1.0), (2440, 1.3)]
    for cx, sc in clumps:
        base_y = float(near_y[int(cx)]) + 40
        leaves = np.zeros((H, W), np.float32)
        spines = []
        for k in range(int(15 * sc) + 6):
            ang = r.normal(0, 0.42)
            ln = r.uniform(190, 400) * sc
            tip = (cx + np.sin(ang) * ln * 1.05 + r.normal(0, 14), base_y - np.cos(ang) * ln)
            base = (cx + r.normal(0, 16 * sc), base_y + r.uniform(0, 30))
            spines.append(blade_mask(leaves, base, tip, bend=np.sin(ang) * ln * 0.36, width=r.uniform(7, 13) * sc))
        near.glaze(leaves, pal["flax"], 1.5, wobble=1.2, soft=0.8, edge=0.5, edge_w=3, bloom=0.4, bloom_cell=60)
        near.glaze(leaves * smoothstep(0.45, 0.6, fbm(H, W, 30, seed0 + int(cx), 3)), pal["near2"], 0.9,
                   wobble=1, soft=0.8, edge=0.3, edge_w=2)
        for s in spines[::2]:
            near.ink(s.astype(np.float32), width=1.5 * sc, colour=pal["ink"], darkness=0.7, tremor=0.5)
        # kōrari: the flower stalk standing above the fan
        top = (cx + r.normal(30, 30) * sc, base_y - 470 * sc)
        stalk = bezier((cx, base_y), (cx + 26 * sc, base_y - 250 * sc), top, 40).astype(np.float32)
        near.ink(stalk, width=3.0 * sc, colour=pal["ink"], darkness=0.9)
        for j in range(6):
            a = stalk[-2 - j * 3]
            near.ink(bezier(a, (a[0] + 18 * sc, a[1] - 6), (a[0] + 34 * sc, a[1] - 26 * sc), 10).astype(np.float32),
                     width=2.6 * sc, colour=pal["ink"], darkness=0.85, tremor=0.3)

    # tī kōuka (cabbage tree): a leaning trunk, spiked heads
    for tx, th, lean in [(330, 560, -60), (2300, 640, 70)]:
        by = float(near_y[tx]) + 30
        trunk = bezier((tx, by), (tx + lean * 0.3, by - th * 0.55), (tx + lean, by - th), 50).astype(np.float32)
        tm = np.zeros((H, W), np.float32)
        for i in range(len(trunk) - 1):
            wdt = int(20 - 9 * i / len(trunk))
            cv2.line(tm, tuple(trunk[i].astype(int)), tuple(trunk[i + 1].astype(int)), 1.0, wdt, cv2.LINE_AA)
        heads = [(trunk[-1], 1.0)]
        for bi, sgn in [(34, -1), (40, 1)]:
            b0 = trunk[bi]
            tip = (b0[0] + sgn * 120, b0[1] - 150)
            br = bezier(b0, (b0[0] + sgn * 90, b0[1] - 30), tip, 24).astype(np.float32)
            for i in range(len(br) - 1):
                cv2.line(tm, tuple(br[i].astype(int)), tuple(br[i + 1].astype(int)), 1.0, 9, cv2.LINE_AA)
            heads.append((np.array(tip, np.float32), 0.8))
        near.glaze(tm, "#4a3f36" if not night else "#2a2a33", 1.5, wobble=1.5, soft=0.9, edge=0.5, edge_w=3)
        near.ink(trunk + [6, 0], width=1.6, colour=pal["ink"], darkness=0.8)
        for (hx, hy), hs in heads:
            spikes = np.zeros((H, W), np.float32)
            for k in range(46):
                ang = r.uniform(-np.pi * 0.95, np.pi * 0.95)
                ln = r.uniform(80, 150) * hs
                tip = (hx + np.sin(ang) * ln, hy - np.cos(ang) * ln * 0.9 + abs(np.sin(ang)) * 26)
                blade_mask(spikes, (hx, hy), tip, bend=0, width=r.uniform(3.2, 5.5) * hs)
            near.glaze(spikes, pal["flax"], 1.7, wobble=0.8, soft=0.7, edge=0.4, edge_w=2, bloom=0.3, bloom_cell=40)
            for k in range(14):
                ang = r.uniform(-np.pi * 0.9, np.pi * 0.9)
                ln = r.uniform(70, 140) * hs
                near.ink(np.linspace((hx, hy), (hx + np.sin(ang) * ln, hy - np.cos(ang) * ln * 0.9), 12).astype(np.float32),
                         width=1.3, colour=pal["ink"], darkness=0.7, tremor=0.3)
    near.ink(ridge_pts(near_y, 0, 900), width=2.8, colour=pal["ink"], darkness=0.7)
    near.ink(ridge_pts(near_y, 1700, W), width=2.8, colour=pal["ink"], darkness=0.7)
    save_rgb(os.path.join(OUT, name, "near.webp"), near.rgb(on_white=True))


def paint_moon() -> None:
    """Rākaunui — the full moon. A disc reserved on the paper, a few grey maria
    dropped in wet, and a halo where the night wash was lifted around it."""
    print("moon")
    S = 900
    paper = Paper(S, S, seed=23)
    sh = Sheet(paper, 77)
    y_, x_ = np.mgrid[0:S, 0:S].astype(np.float32)
    d = np.hypot(x_ - S / 2, y_ - S / 2)
    R = 210.0
    disc = (d < R).astype(np.float32)
    sh.glaze(disc, "#f4ead2", 0.5, wobble=2.5, soft=1.2, edge=0.25, edge_w=6, bloom=0.4, bloom_cell=120)
    maria = smoothstep(0.55, 0.68, fbm(S, S, 95, 31, 4)) * disc
    sh.glaze(maria, "#b9b3a6", 0.42, wobble=4, soft=3, edge=0.2, wet=7)
    sh.glaze(disc * smoothstep(-R, R, x_ - S / 2 + (y_ - S / 2) * 0.4), "#d9cfb8", 0.22, wobble=0, soft=8, edge=0)
    rgb = sh.rgb()
    edge = sh.warp(disc, 2.5)
    halo = np.exp(-((np.clip(d - R, 0, None) / 105) ** 1.25)) * 0.42 * (0.8 + 0.4 * fbm(S, S, 80, 5, 3))
    window = smoothstep(S / 2, S / 2 - 110, d)                    # the plate has no visible edge
    alpha = np.maximum(blur(edge, 1.4), halo * window * (1 - blur(edge, 1.4)))
    halo_rgb = np.ones((S, S, 3), np.float32) * hex_rgb("#f6ecc9")[None, None, :]
    k = blur(edge, 1.4)[:, :, None]
    save_rgba(os.path.join(OUT, "moon.webp"), rgb * k + halo_rgb * (1 - k), alpha)

    # the dawn sun: no disc line at all, only lifted light and a warm second halo
    sun = np.exp(-((d / 150) ** 2.2))
    corona = np.exp(-((d / 400) ** 1.4)) * 0.55 * (0.8 + 0.4 * fbm(S, S, 90, 8, 3))
    a = np.clip(np.maximum(sun, corona * smoothstep(S / 2, S / 2 - 200, d)), 0, 1)
    col = hex_rgb("#fff6d8")[None, None, :] * sun[:, :, None] + hex_rgb("#ffd89a")[None, None, :] * (1 - sun[:, :, None])
    save_rgba(os.path.join(OUT, "sun.webp"), np.clip(col, 0, 1), a)


WASHES = {
    # the film's colour script: one damp wash per chapter, behind the product window
    "paper": [("#efe6d2", 0.35), ("#e3ead9", 0.25)],
    "pounamu": [("#bfe6cf", 0.95), ("#8fd3b4", 0.5), ("#e4f1cf", 0.4)],
    "moana": [("#c3dcf2", 0.95), ("#9cc3e6", 0.5), ("#cfeee6", 0.4)],
    "kowhai": [("#f8e3ad", 0.95), ("#f3c98a", 0.45), ("#f6edc8", 0.4)],
    "po": [("#d9cdf0", 0.95), ("#b9b3e6", 0.5), ("#f0d7e6", 0.4)],
    "ata": [("#fbd6c0", 0.9), ("#f6b9a6", 0.4), ("#fbe9c2", 0.45)],
}


def paint_washes() -> None:
    S = 2400
    paper = Paper(S, S, seed=51)
    for i, (name, coats) in enumerate(WASHES.items()):
        print(f"wash: {name}")
        sh = Sheet(paper, 600 + i)
        for j, (col, strength) in enumerate(coats):
            n = fbm(S, S, 700, 610 + i * 10 + j, 4)
            m = np.ones((S, S), np.float32) if j == 0 else smoothstep(0.42, 0.66, n)
            sh.glaze(m, col, strength, wobble=40, soft=28, edge=0.5 if j else 0.0, edge_w=22,
                     bloom=0.55, bloom_cell=520, granulate=0.55, wet=30 if j else 0)
        # a few back-runs: clean water dropped into a drying wash
        r = rng(650 + i)
        runs = np.zeros((S, S), np.float32)
        for _ in range(5):
            cv2.circle(runs, (int(r.uniform(0, S)), int(r.uniform(0, S))), int(r.uniform(90, 260)), 1.0, -1)
        runs = sh.warp(runs, 60, 120)
        ring = np.clip(blur(runs, 4) - blur(runs, 18), 0, 1) * 2
        sh.lift(runs, 0.22, soft=14)
        sh.glaze(ring, coats[0][0], 0.5, wobble=0, soft=2, edge=0)
        save_rgb(os.path.join(OUT, "wash", f"{name}.webp"), sh.rgb(), quality=88)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", choices=["night", "dawn", "moon", "washes"])
    a = ap.parse_args()
    if a.only in (None, "night"):
        paint_scene("night")
    if a.only in (None, "dawn"):
        paint_scene("dawn")
    if a.only in (None, "moon"):
        paint_moon()
    if a.only in (None, "washes"):
        paint_washes()


if __name__ == "__main__":
    sys.exit(main())
