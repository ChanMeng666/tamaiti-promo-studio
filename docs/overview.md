# tamaiti-promo-studio

The promo film for **TAM-AI-TI** (live at
[tamaiti.whiri-ai.com](https://tamaiti.whiri-ai.com)): financial wellness that
weaves Māori wisdom with AI.

Nothing in this film is a screen recording, an SVG illustration or a generated
image. Three things are made, all by code:

| | how | where |
|---|---|---|
| **The product on screen** | the app's own screens rebuilt as pure functions of time, fed with the app's own strings and data | `src/replica/` |
| **The landscape** | a watercolour engine (numpy + OpenCV) that paints layered plates: washes as optical density, granulation, edge pooling, pen lines with pressure | `art/paint.py` → `public/art/` |
| **The sound** | a written score and a small palette of effects, both synthesised | `audio/` → `public/audio/` |

Remotion assembles them at 30 fps.

## Deliverables

Six masters, from one scene library and one edit list per length. H.264, 30 fps,
AAC 48 kHz, normalised to -16 LUFS:

| length | aspect | file | size | loudness | true peak |
|---|---|---|---|---|---|
| 60 s | 16:9 | `tam-ai-ti_60s_landscape_1920x1080.mp4` | 25.5 MB | -15.9 LUFS | -3.4 dBTP |
| 60 s | 9:16 | `tam-ai-ti_60s_vertical_1080x1920.mp4` | 27.0 MB | -15.9 LUFS | -3.4 dBTP |
| 30 s | 16:9 | `tam-ai-ti_30s_landscape_1920x1080.mp4` | 16.3 MB | -15.9 LUFS | -5.4 dBTP |
| 30 s | 9:16 | `tam-ai-ti_30s_vertical_1080x1920.mp4` | 16.8 MB | -15.9 LUFS | -5.4 dBTP |
| 15 s | 16:9 | `tam-ai-ti_15s_landscape_1920x1080.mp4` | 8.8 MB | -15.8 LUFS | -5.9 dBTP |
| 15 s | 9:16 | `tam-ai-ti_15s_vertical_1080x1920.mp4` | 9.0 MB | -15.8 LUFS | -5.9 dBTP |

The 60 s cut is the whole arc: moonrise hook, the daily proverb and check-in,
the lunar calendar, goals and action plans, the voice journal, the voice coach,
the whānau support circle, and a dawn end card. The 30 s cut keeps every scene
and plays tighter windows; the 15 s cut is the hook, four single gestures and
the end card. The vertical cuts are a re-layout (the product is shown as a
phone), not a crop.

The mp4 files are not committed. They are written to `out/masters/`, and
`out/masters/MANIFEST.json` (committed) records each one's sha256, frame count,
loudness, true peak, and the film and product commits it was built from.

## Requirements

- Node.js 22 or newer, and ffmpeg / ffprobe on the PATH
- Python 3 with numpy, opencv-python, pillow and scipy (only to repaint the art or re-synthesise the audio)
- The product's source checked out beside this repo (it is private; only `npm run bake` and the two gates that read it need it; pass its path with `--product`)
- About 8 GB of free memory to render; `--concurrency 3` is a safe setting on a 16 GB machine

## Commands

```bash
npm install
npm run bake        # read strings + data out of the product repo into src/replica/data/
npm run art         # paint the watercolour plates            (python: numpy, opencv, pillow)
npm run audio       # synthesise the music beds and effects   (python: numpy, scipy)
npm run verify      # the gate suite
npm run dev         # Remotion Studio
npm run stills -- --comp Tamaiti-60-Landscape --every 2.5 --scale 0.5
npm run sheet       # tile the stills into contact sheets
npm run render      # gates, then all six masters
node scripts/render.mjs --only 60l --concurrency 3   # one master; also --only 60 | 15v
```

`bake`, `art` and `audio` are deterministic and their outputs are committed, so
a fresh clone renders without Python and without the product repo.

## How it is put together

```
art/paint.py                 watercolour engine + the two scenes (night, dawn) + stage washes
audio/synth_music.py         the score, one arrangement per cut length -> beds + src/data/music.json
audio/synth_sfx.py           seven sound roles -> wavs + src/data/sfx.json
scripts/bake-product-data.mjs  product repo -> src/replica/data/product.generated.json
scripts/render.mjs           gates -> render -> loudness -> manifest

src/core/timeline.ts         the ONLY frame arithmetic in the repo
src/core/layout-core.ts      the deliverables table, safe areas, the window per aspect
src/edits.ts                 the edit decision lists, in seconds, on bar lines
src/scenes.ts                the scene library
src/copy.ts                  the film's own words (cleared in copy-clearance.md)
src/cues.ts                  the cue sheet, derived from the screenplays

src/replica/strings.ts       every product word, each tied to its product source file
src/replica/demo.ts          the fictional demo persona: the only invented content
src/replica/screenplays.ts   when things happen on each screen (shared by picture and sound)
src/replica/screens/*.tsx    Dashboard, Maramataka, Goals, Journal, Coach, Whānau
src/components/*.tsx         the watercolour stage, the product window, captions, end card

capture/verify.mjs           the gates
capture/stills.mjs           the look loop: stills, contact frames, hand-over frames
```

### What is real and what is not

- **Real, read from the product:** every label and button (274 strings, checked
  against the product's source on every `verify`), the thirty lunar days of June
  2025 through the product's own date lookup, the moon-phase drawings, the
  proverb, the goal types, the seven action plans, the journal's example
  sentences, both lines of coach dialogue.
- **Invented, and said so on the end card:** the demo persona in
  `src/replica/demo.ts` — a name, a goal, its amounts, three supporters. The
  product's database holds real people's entries; none of it is used.

### The gates

`npm run verify` bundles the film's own React-free modules and executes them:

| gate | fails when |
|---|---|
| bake | the committed product data no longer matches the product repo |
| strings | a replica string is not in the product file it names |
| assets | a plate or sound the film names is missing |
| timeline | a cut does not sum to its length, a replica window is illegal or runs faster than 1.45×, or frame arithmetic appears outside `core/timeline.ts` |
| bars | a cut is not on a bar line of its own bed, or the end card misses the cadence |
| copy | a film-voice line has no clearance row, cannot be read in its time, or makes a banned claim |
| numbers | the demo persona's figures contradict each other or the product's data |
| audio | a cue is out of range, more than four sound at once, or the bed is ducked too often |
| purity | a transition, animation, clock, random call or stateful hook appears in the picture |
| honesty | a cut does not end on the disclosure card, or shows it for under 2.5 s |

Each prints how many things it looked at, and zero is a failure. See
[decisions.md](decisions.md) for the mutation evidence.

## Notes for whoever changes this next

- **Changing the product's copy** turns `bake`/`strings` red. Re-run
  `npm run bake`, fix `src/replica/strings.ts` if a hard-coded string moved, and
  re-render. Do not edit `product.generated.json`.
- **Replacing the music** with a recorded or generated take: put the take's
  measured bar times into `src/data/music.json` in the same shape and the
  edit, the cue sheet and the `bars` gate follow. Record the licence in
  `provenance` — the `audio` gate refuses an asset that is not cleared.
- **Nobody has listened to these masters yet.** Loudness and true peak are
  measured; whether the bed is pleasant is a human judgement. See
  [decisions.md](decisions.md).
