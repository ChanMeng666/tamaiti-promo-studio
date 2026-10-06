"""Sound effects, synthesised. Six ROLES, each a small family of files.

A cue in the film names a role and an intent ("click:button"), never a file;
`src/data/sfx.json` (written here) is the manifest that maps one to the other
and carries the gain. Everything is seeded, 48 kHz mono, peak-normalised, WAV
(a lossy codec's encoder delay would move a click off its frame).

The palette is deliberately soft and wooden -- tines, taps, breath -- to sit
with the kalimba bed and a product about wellbeing.

    python audio/synth_sfx.py
"""

from __future__ import annotations

import json
import os

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "public", "audio", "sfx")
MANIFEST = os.path.join(HERE, "..", "src", "data", "sfx.json")
PEAK = 10 ** (-3 / 20)


def t(dur: float) -> np.ndarray:
    return np.arange(int(dur * SR)) / SR


def band(x: np.ndarray, lo: float, hi: float) -> np.ndarray:
    return sosfilt(butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x)


def noise(seed: int, n: int) -> np.ndarray:
    return np.random.default_rng(seed).standard_normal(n)


def hz(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def tine(m: float, dur: float, decay: float = 0.3) -> np.ndarray:
    x = t(dur)
    f = hz(m)
    return (np.sin(2 * np.pi * f * x) * np.exp(-x / decay)
            + 0.25 * np.sin(2 * np.pi * f * 5.4 * x) * np.exp(-x / 0.03)) * np.minimum(1, x / 0.003)


def click(seed: int) -> np.ndarray:
    """A soft wooden tap: a very short pitched thump under a tick of noise."""
    x = t(0.09)
    thump = np.sin(2 * np.pi * (310 + 40 * (seed % 3)) * x) * np.exp(-x / 0.012)
    tick = band(noise(seed, len(x)), 1800, 7000) * np.exp(-x / 0.004) * 0.6
    return thump + tick


def key(seed: int) -> np.ndarray:
    x = t(0.06)
    tick = band(noise(seed, len(x)), 2400 + 300 * (seed % 4), 9000) * np.exp(-x / 0.006)
    body = np.sin(2 * np.pi * (520 + 60 * (seed % 5)) * x) * np.exp(-x / 0.008) * 0.5
    return tick + body


def whoosh(seed: int, dur: float, up: bool) -> np.ndarray:
    """Breath, not wind: band-passed noise whose centre glides, under a soft swell."""
    x = t(dur)
    n = noise(seed, len(x))
    out = np.zeros_like(x)
    for i in range(8):
        a = i / 7
        f = 500 * (6 ** (a if up else 1 - a))
        env = np.exp(-(((x / dur) - (0.15 + 0.7 * a)) / 0.16) ** 2)
        out += band(n, f * 0.7, f * 1.4) * env
    return out * np.sin(np.pi * np.clip(x / dur, 0, 1)) ** 1.2


def pop(seed: int) -> np.ndarray:
    """A droplet: a fast upward pitch glide."""
    x = t(0.16)
    f = 380 + 520 * (1 - np.exp(-x / 0.02)) + 30 * (seed % 3)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-x / 0.045) * np.minimum(1, x / 0.002)


def chime(notes: list[float], gap: float, dur: float = 1.3) -> np.ndarray:
    out = np.zeros(int((dur + gap * len(notes)) * SR))
    for i, m in enumerate(notes):
        s = tine(m, dur, 0.38)
        o = int(i * gap * SR)
        out[o:o + len(s)] += s
    return out


def tick(seed: int) -> np.ndarray:
    return tine(86 + (seed % 3) * 2, 0.25, 0.05) * 0.8


def landing() -> np.ndarray:
    """The end card: a low bloom and a wide tine stack. The bed's own cadence
    carries the harmony; this adds the weight under it."""
    x = t(1.8)
    sub = np.sin(2 * np.pi * 73.4 * x) * np.exp(-x / 0.5)
    air = band(noise(9, len(x)), 1500, 9000) * np.exp(-x / 0.25) * 0.12
    ch = chime([62, 74, 81], 0.03, 1.6)
    ch = np.pad(ch, (0, max(0, len(x) - len(ch))))[: len(x)]
    return sub + air + 0.4 * ch


def write(name: str, x: np.ndarray, fade: float = 0.02) -> dict:
    n = int(fade * SR)
    x = x.copy()
    x[-n:] *= np.linspace(1, 0, n)
    x *= PEAK / np.abs(x).max()
    os.makedirs(OUT, exist_ok=True)
    wavfile.write(os.path.join(OUT, name + ".wav"), SR, (x * 32767).astype(np.int16))
    # the anchor is where a listener hears it happen: the first strong onset
    env = np.abs(x)
    onset = int(np.argmax(env > 0.5 * env.max())) / SR
    return {"file": f"audio/sfx/{name}.wav", "durationSec": round(len(x) / SR, 4), "onsetSec": round(onset, 4)}


def main() -> None:
    files = {}
    for i in range(3):
        files[f"click-{i + 1}"] = write(f"click-{i + 1}", click(100 + i))
    for i in range(4):
        files[f"key-{i + 1}"] = write(f"key-{i + 1}", key(200 + i), 0.01)
    files["whoosh-in"] = write("whoosh-in", whoosh(300, 0.55, True), 0.08)
    files["whoosh-out"] = write("whoosh-out", whoosh(301, 0.5, False), 0.08)
    for i in range(3):
        files[f"pop-{i + 1}"] = write(f"pop-{i + 1}", pop(400 + i))
    files["chime-up"] = write("chime-up", chime([74, 78, 81], 0.075), 0.2)
    files["chime-done"] = write("chime-done", chime([69, 74, 78, 86], 0.06, 1.6), 0.3)
    for i in range(3):
        files[f"tick-{i + 1}"] = write(f"tick-{i + 1}", tick(i), 0.03)
    files["landing"] = write("landing", landing(), 0.4)

    manifest = {
        "provenance": {
            "source": "synthesised by audio/synth_sfx.py in this repository",
            "commercialUse": True,
        },
        # role -> gain, the files it may draw from, and how hard it leans on the bed.
        # texture:false = a transient, anchored on its onset.
        "roles": {
            "click":  {"gainDb": -13, "duckDb": 0,  "variants": ["click-1", "click-2", "click-3"]},
            "type":   {"gainDb": -19, "duckDb": 0,  "variants": ["key-1", "key-2", "key-3", "key-4"]},
            "move":   {"gainDb": -17, "duckDb": 0,  "variants": ["whoosh-in", "whoosh-out"], "texture": True},
            "appear": {"gainDb": -15, "duckDb": 0,  "variants": ["pop-1", "pop-2", "pop-3"]},
            "tick":   {"gainDb": -20, "duckDb": 0,  "variants": ["tick-1", "tick-2", "tick-3"]},
            "reward": {"gainDb": -11, "duckDb": -3, "variants": ["chime-up", "chime-done"]},
            "end":    {"gainDb": -8,  "duckDb": -2, "variants": ["landing"]},
        },
        "files": files,
    }
    with open(MANIFEST, "w", encoding="utf8", newline="\n") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")
    for k, v in files.items():
        print(f"  {k:12s} {v['durationSec']:.3f}s  onset {v['onsetSec'] * 1000:.1f} ms")
    print(f"wrote {len(files)} files + src/data/sfx.json")


if __name__ == "__main__":
    main()
