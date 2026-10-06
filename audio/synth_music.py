"""The music bed, synthesised.

There is no generated-music take in this repo: the bed is written as a score
and rendered by this file, one arrangement PER CUT LENGTH. That buys three
things a spliced take cannot give:

  * the beat grid is exact by construction -- `src/data/music.json` is the
    score's own bar table, not a measurement of an audio file;
  * every cut has a real ending (a resolved chord that rings out to the last
    sample), not a fade or a splice;
  * the licence question is closed: the notes and the synthesis are this
    repo's own work.

96 BPM, 4/4, D major. A bar is exactly 2.5 s, so 15 / 30 / 60 s are 6 / 12 / 24
bars with nothing left over.

    python audio/synth_music.py         # writes public/audio/bed-<cut>.wav + src/data/music.json
"""

from __future__ import annotations

import json
import os

import numpy as np
from scipy.io import wavfile
from scipy.signal import fftconvolve, butter, sosfilt

SR = 48000
BPM = 96.0
BEAT = 60.0 / BPM
BAR = BEAT * 4
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_AUDIO = os.path.join(HERE, "..", "public", "audio")
OUT_DATA = os.path.join(HERE, "..", "src", "data", "music.json")

# section plans, in bars. The edit maps its chapters onto these names.
PLANS = {
    15: [("intro", 1), ("chorus", 4), ("end", 1)],
    30: [("intro", 1), ("verse", 4), ("chorus", 4), ("lift", 2), ("end", 1)],
    60: [("intro", 2), ("verse", 4), ("verse2", 4), ("chorus", 4), ("breakdown", 4), ("chorus2", 4), ("end", 2)],
}


def hz(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


class Track:
    def __init__(self, seconds: float):
        self.n = int(round(seconds * SR))
        self.dry = np.zeros((self.n, 2), np.float64)
        self.wet = np.zeros((self.n, 2), np.float64)   # send to reverb

    def add(self, t0: float, mono: np.ndarray, gain: float = 1.0, pan: float = 0.0, send: float = 0.2):
        i = int(round(t0 * SR))
        if i >= self.n or i < 0:
            return
        m = mono[: self.n - i] * gain
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        self.dry[i:i + len(m), 0] += m * l
        self.dry[i:i + len(m), 1] += m * r
        self.wet[i:i + len(m), 0] += m * l * send
        self.wet[i:i + len(m), 1] += m * r * send


def tgrid(dur: float) -> np.ndarray:
    return np.arange(int(dur * SR)) / SR


def pluck(m: float, dur: float = 1.4, bright: float = 1.0) -> np.ndarray:
    """A kalimba-like tine: a pure fundamental, a short inharmonic chiff on top."""
    t = tgrid(dur)
    f = hz(m)
    body = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.42)
    over = 0.30 * bright * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.16)
    tine = 0.22 * bright * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.035)
    att = np.minimum(1, t / 0.004)
    return (body + over + tine) * att


def lead(m: float, dur: float) -> np.ndarray:
    """A soft sung sine: slow vibrato that arrives late, breath of second harmonic."""
    t = tgrid(dur + 0.35)
    f = hz(m)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - 0.18) / 0.3, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    env = np.minimum(1, t / 0.05) * np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.12))
    return (np.sin(ph) + 0.16 * np.sin(2 * ph) + 0.05 * np.sin(3 * ph)) * env


def pad(notes: list[float], dur: float) -> np.ndarray:
    t = tgrid(dur + 1.2)
    out = np.zeros_like(t)
    for k, m in enumerate(notes):
        for det in (-0.07, 0.0, 0.08):
            f = hz(m + det)
            for h in range(1, 6):
                out += np.sin(2 * np.pi * f * h * t + k + h) / (h ** 2.1) / 3
    env = np.minimum(1, t / 0.5) * np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.5))
    trem = 1 + 0.06 * np.sin(2 * np.pi * 0.4 * t)
    return out * env * trem / max(1, len(notes)) * 2


def bass(m: float, dur: float) -> np.ndarray:
    t = tgrid(dur + 0.1)
    f = hz(m)
    env = np.minimum(1, t / 0.008) * np.where(t < dur, np.exp(-t / 0.9), np.exp(-dur / 0.9) * np.exp(-(t - dur) / 0.04))
    return np.tanh(1.6 * (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t))) * env


def kick() -> np.ndarray:
    t = tgrid(0.32)
    f = 46 + 95 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / 0.11) * np.minimum(1, t / 0.002)


def noise_hit(seed: int, dur: float, lo: float, hi: float, decay: float) -> np.ndarray:
    t = tgrid(dur)
    n = np.random.default_rng(seed).standard_normal(len(t))
    sos = butter(2, [lo, hi], btype="band", fs=SR, output="sos")
    return sosfilt(sos, n) * np.exp(-t / decay) * np.minimum(1, t / 0.002)


# harmony: one chord per bar, a four-bar loop
LOOP = [  # (root for bass, pad voicing)
    (38, [57, 62, 66, 69]),   # D
    (45, [57, 61, 64, 69]),   # A
    (47, [59, 62, 66, 71]),   # Bm
    (43, [55, 59, 62, 67]),   # G
]
BREAK = [
    (43, [55, 59, 62, 66]),   # Gmaj7
    (38, [57, 62, 66, 69]),   # D
    (40, [55, 59, 64, 67]),   # Em
    (45, [57, 61, 64, 67]),   # A7
]
END = (38, [57, 62, 64, 66, 69, 74])  # Dadd9

# kalimba figure, eighths (None = rest), per loop bar
FIG = [
    [74, None, 78, 81, None, 78, None, 76],
    [76, None, 81, 76, None, 73, None, 76],
    [74, None, 78, 83, None, 81, None, 78],
    [71, None, 74, 79, None, 78, 76, None],
]
FIG_SPARSE = [
    [74, None, None, 81, None, None, 78, None],
    [76, None, None, 81, None, None, None, None],
    [74, None, None, 83, None, None, 81, None],
    [79, None, None, 78, None, 76, None, None],
]
# the sung line, (beat, length in beats, note)
TUNE = [
    [(0, 2, 81), (2, 1, 78), (3, 1, 81)],
    [(0, 1.5, 83), (1.5, 0.5, 81), (2, 2, 76)],
    [(0, 2, 86), (2, 1, 83), (3, 1, 81)],
    [(0, 1, 83), (1, 1, 81), (2, 2, 78)],
]
TUNE2 = [
    [(0, 1, 81), (1, 1, 86), (2, 1, 85), (3, 1, 81)],
    [(0, 1.5, 83), (1.5, 0.5, 81), (2, 2, 88)],
    [(0, 2, 86), (2, 1, 83), (3, 1, 86)],
    [(0, 1, 83), (1, 1, 81), (2, 1, 78), (3, 1, 76)],
]


def render(cut: int) -> dict:
    plan = PLANS[cut]
    tr = Track(cut)
    kick_s, shaker = kick(), None
    sections, bar = [], 0
    for name, nbars in plan:
        sections.append({"name": name, "startBar": bar, "bars": nbars,
                         "startSec": bar * BAR, "endSec": (bar + nbars) * BAR})
        for b in range(nbars):
            t0 = (bar + b) * BAR
            k = b % 4
            chords = BREAK if name in ("breakdown", "lift") else LOOP
            root, voicing = END if name == "end" else chords[k]
            full = name in ("chorus", "chorus2")
            drums = name in ("verse", "verse2", "chorus", "chorus2")
            last_of_section = b == nbars - 1

            if name == "end":
                if b == 0:
                    # the cadence: everything lands together and is left to ring
                    ring = cut - t0
                    tr.add(t0, pad(voicing, ring - 1.0), 0.20, 0, 0.5)
                    tr.add(t0, bass(root, min(2.4, ring - 0.3)), 0.34, 0, 0.05)
                    tr.add(t0, kick_s, 0.5, 0, 0.1)
                    for j, m in enumerate([62, 66, 69, 74, 78, 81, 86]):
                        tr.add(t0 + j * 0.045, pluck(m, 3.2, 0.8), 0.16, (j - 3) / 4, 0.5)
                continue

            tr.add(t0, pad(voicing, BAR), 0.13 if not full else 0.16, 0, 0.45)

            fig = FIG if name not in ("intro", "breakdown") else FIG_SPARSE
            for e, m in enumerate(fig[k]):
                if m is None:
                    continue
                acc = 1.0 if e % 4 == 0 else 0.72
                tr.add(t0 + e * BEAT / 2, pluck(m, 1.6), 0.17 * acc, -0.25 + 0.5 * ((e * 5) % 8) / 7, 0.38)

            if name != "intro" and name != "breakdown":
                for beat, ln in [(0, 1.4), (1.5, 0.45), (2, 1.3), (3.5, 0.4)]:
                    tr.add(t0 + beat * BEAT, bass(root if beat != 3.5 else root + 7, ln * BEAT), 0.30, 0, 0.03)
            elif name == "breakdown":
                tr.add(t0, bass(root, 3.6 * BEAT), 0.22, 0, 0.05)

            if drums:
                for beat in (0, 2) if name == "verse" else (0, 1, 2, 3):
                    tr.add(t0 + beat * BEAT, kick_s, 0.46, 0, 0.04)
                if name != "verse":
                    for e in range(8):
                        tr.add(t0 + e * BEAT / 2, noise_hit(900 + e, 0.09, 5200, 11000, 0.022),
                               0.050 if e % 2 else 0.028, 0.35, 0.1)
                    for beat in (1, 3):
                        tr.add(t0 + beat * BEAT, noise_hit(77 + beat, 0.16, 1100, 3800, 0.045), 0.10, -0.2, 0.3)
                if full:
                    for s in range(16):  # sixteenth arpeggio, an octave under the tune
                        m = voicing[s % len(voicing)] + (12 if (s // 4) % 2 else 0)
                        tr.add(t0 + s * BEAT / 4, pluck(m, 0.5, 0.5), 0.05, 0.5 - (s % 4) / 3, 0.3)
            if full:
                for beat, ln, m in (TUNE2 if name == "chorus2" else TUNE)[k]:
                    tr.add(t0 + beat * BEAT, lead(m, ln * BEAT * 0.94), 0.105, 0.1, 0.5)
            if name == "lift":
                for e in range(8):  # rising eighths into the cadence
                    tr.add(t0 + e * BEAT / 2, pluck(voicing[e % 4] + 12 + (12 if b else 0), 0.9), 0.10 + 0.01 * e, 0, 0.4)

            # a pickup into the next section: a swell and a small fill
            if last_of_section and name != "end":
                sw = noise_hit(5 + bar, BEAT * 2, 2500, 9000, 9.0) * np.linspace(0, 1, int(BEAT * 2 * SR)) ** 2.5
                tr.add(t0 + 2 * BEAT, sw, 0.045, 0, 0.5)
                for j, m in enumerate([74, 78, 81]):
                    tr.add(t0 + (3 + j / 3) * BEAT, pluck(m, 0.8), 0.11, 0, 0.4)
        bar += nbars

    # the opening hit: a bell-like stack and a low bloom, in the first sample
    for j, m in enumerate([62, 69, 74, 81]):
        tr.add(0.0 + j * 0.03, pluck(m, 3.0, 1.1), 0.20, (j - 1.5) / 3, 0.55)
    tr.add(0.0, bass(38, 1.8), 0.26, 0, 0.1)

    # one small room for everything
    rng = np.random.default_rng(1)
    t = tgrid(2.2)
    ir = rng.standard_normal((len(t), 2)) * np.exp(-t / 0.55)[:, None]
    ir[: int(0.012 * SR)] = 0
    sos = butter(2, [250, 7000], btype="band", fs=SR, output="sos")
    ir = sosfilt(sos, ir, axis=0)
    ir /= np.sqrt((ir ** 2).sum(0))[None, :]
    wet = np.stack([fftconvolve(tr.wet[:, c], ir[:, c])[: tr.n] for c in (0, 1)], 1)
    mix = tr.dry + 0.9 * wet

    # glue: gentle saturation, then a fixed peak. Loudness is set on the master.
    mix = np.tanh(mix * 1.5) / 1.5
    fade = int(0.35 * SR)
    mix[-fade:] *= (np.linspace(1, 0, fade) ** 2)[:, None]
    mix[: int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))[:, None]
    mix *= 0.6 / np.abs(mix).max()

    os.makedirs(OUT_AUDIO, exist_ok=True)
    path = os.path.join(OUT_AUDIO, f"bed-{cut}.wav")
    wavfile.write(path, SR, (mix * 32767).astype(np.int16))
    nbars = sum(n for _, n in plan)
    print(f"bed-{cut}.wav  {nbars} bars  {len(mix) / SR:.3f}s  peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS")
    return {
        "file": f"audio/bed-{cut}.wav",
        "durationSec": cut,
        "bars": nbars,
        "downbeats": [round(i * BAR, 6) for i in range(nbars)],
        "sections": sections,
    }


def main() -> None:
    beds = {str(c): render(c) for c in PLANS}
    data = {
        "provenance": {
            "source": "synthesised by audio/synth_music.py in this repository",
            "commercialUse": True,
            "note": "Original score and synthesis; no third-party samples, no generated-music service.",
        },
        "bpm": BPM, "beatSec": BEAT, "barSec": BAR, "beds": beds,
    }
    os.makedirs(os.path.dirname(OUT_DATA), exist_ok=True)
    with open(OUT_DATA, "w", encoding="utf8", newline="\n") as f:
        json.dump(data, f, indent=2)
        f.write("\n")
    print("wrote src/data/music.json")


if __name__ == "__main__":
    main()
