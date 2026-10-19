<div align="center">

# TAM-AI-TI product film

**A 60-second product film for [TAM-AI-TI](https://tamaiti.whiri-ai.com), made entirely in code: the app's screens rebuilt in Remotion, a watercolour landscape painted by a Python engine, and a synthesised score.**

</div>

## The film

### TAM-AI-TI product film



https://github.com/user-attachments/assets/5470523f-7c7a-4762-81ea-6acac6c435ad



▶ Watch on YouTube: https://youtu.be/rJb7A_Ljmrs

Also cut at 30 s and 15 s, each in 16:9 and 9:16 (the vertical cuts are a re-layout, not a crop).

## How it's made

- **Coded replica, not a screen recording.** The product's screens are rebuilt in React as pure functions of the frame (`src/replica/`), fed with the product's own strings and data, baked to `src/replica/data/product.generated.json`.
- **Painted by code.** A watercolour engine in Python (numpy + OpenCV) paints layered plates with wet washes, granulation, edge pooling and pressure-weighted pen lines (`art/paint.py` → `public/art/`).
- **Synthesised sound.** A written score and a small set of effects, both generated in Python (`audio/`), on an exact bar grid that the edit lists cut to (`src/edits.ts`).
- **Gates before every render.** `capture/verify.mjs` checks that every on-screen product string exists in the product, cuts land on bar lines, film-voice copy is cleared, and every cut ends on the disclosure card.
- **Delivered loudness.** Each master is normalised with a two-pass ffmpeg `loudnorm` to -16 LUFS, and `out/masters/MANIFEST.json` records what the delivered file measures.

## Make your own

Needs Node.js 22+ and ffmpeg on the PATH. The baked product data, painted plates and audio are committed, so a fresh clone renders without Python.

```bash
npm install
npm run dev                                   # Remotion Studio
node scripts/render.mjs --skip-gates --only 60l   # one master -> out/masters/
node scripts/render.mjs --skip-gates              # all six
```

The product's own source is not in this repo, so the `bake` and `strings` gates (and so `npm run verify` and a plain `npm run render`) need it checked out and passed with `--product <dir>`. Repainting (`npm run art`) and re-synthesising (`npm run audio`) need Python 3 with numpy, opencv-python, pillow and scipy.

## Licence

- **Code:** MIT ([LICENSE](LICENSE)).
- **Films, music, sound effects and painted images made by Chan Meng:** CC BY 4.0 ([LICENSE-MEDIA.md](LICENSE-MEDIA.md)).
- **Not covered, under their owners' terms:** the TAM-AI-TI name, interface design, product copy and data (Whiri-AI); the maramataka content, adapted in the product from Wiremu Tawhai's *Living by the Moon* (Huia Publishers); whakataukī (Māori proverbs); fonts Inter and Fraunces (SIL OFL); Lucide icons (ISC); npm libraries (their own licences).

More detail: [docs/overview.md](docs/overview.md)
