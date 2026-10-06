# Decisions

## The brief

1. **What the product is.** A web app that helps a person build money habits
   through Māori frameworks: a daily proverb and check-in, the lunar calendar,
   goals with action plans, a journal across the dimensions of hauora, a voice
   coach, and a whānau support circle.
2. **Who the film is for.** People meeting the product for the first time, on
   the landing page and in social feeds; hence 16:9 and 9:16.
3. **What must be understood by the end of the shortest cut.** It is a money
   tool, it is grounded in te ao Māori, and it is a real working product.
4. **What must never be claimed.** Outcomes, speed, or anything that reads as
   financial advice; and nothing a viewer could take for a real user's data.
5. **Deliverables.** 15 / 30 / 60 s × 16:9 / 9:16.

## Constraints registry

| id | rule | why | source | enforced by |
|---|---|---|---|---|
| C1 | Every product string on screen is the product's own, verbatim | a string the product does not say is a lie about it | product-film method | `strings` gate |
| C2 | No real user's data appears | `data/exports/` in the product repo holds real journals, goals and names | privacy | `src/replica/demo.ts` is the only persona source; human check |
| C3 | Lunar days, moon phases and proverbs come from the product's data, never retyped | this is mātauranga Māori with a cited source (Wiremu Tawhai, *Living by the Moon*); retyping invites error | cultural accuracy | `bake` gate |
| C4 | No invented Māori design motifs | the film must not improvise cultural patterns. The landscape is nature only (moon, sea, hills, harakeke, tī kōuka) | cultural safety | human judgement |
| C5 | No invented AI output | the coach scene shows only the two lines the product scripts | honesty | `strings` gate (both lines are checked) |
| C6 | The viewer is told the interface is a recreation and the account is a demo | the replica is code and could draw anything | honesty | `honesty` gate; ≥ 2.5 s in every cut |
| C7 | No speed, outcome or advice claims; no currency figure in the film's voice | regulated territory for a money product | prudence | `copy` gate (banned patterns) |
| C8 | Film-voice lines are cleared | the line nobody cleared is the one that slips | method | `copy` gate + `docs/copy-clearance.md` |
| C9 | Te reo is set with its macrons | Inter and Fraunces are loaded with `latin-ext` | correctness | human check on stills |

## Choices made

**D1 — Replica, not capture.** Every screen behind the login needs an account
and a database; the film needs to re-lay-out for 9:16 and to be re-timed to
music. So the six screens are rebuilt (`src/replica/screens/`) from the
product's Tailwind classes and theme tokens, with its `lucide-react` icons at
the same version. The replica is not synced from the product (the product's
components are coupled to Next.js, its database and CopilotKit); instead the
*strings and data* are baked and gated.

**D2 — The app opens in te reo Māori.** The product's default language is
`mi`. The dashboard scene starts in Māori and the pointer switches it to
English, which is both true to the product and the film's first demonstration.

**D3 — One real night.** "Today" is 11 June 2025: a date inside the product's
authentic lunar table, and the full moon (Te Rākaunui). The painted moon in the
hook and the moon in the calendar are the same night.

**D4 — Watercolour for everything that is not the product.** The product
window keeps its true colours; the world around it is paper and pigment, so a
viewer never confuses film furniture with interface. One damp wash per chapter
is the colour script.

**D5 — The music is synthesised here.** There was no licensed take to cut to,
and a generated-music service cannot be driven from this repo. A written score
gives an exact bar grid (2.5 s at 96 BPM), a real cadence in every length and
no licence question. It is also the weakest-evidenced part of the film: see
"not yet judged" below. `src/data/music.json` is shaped so a recorded take can
replace it.

**D6 — Loudness is set on the delivered file.** Each master gets a two-pass
linear `loudnorm` to −16 LUFS / −1.5 dBTP after rendering, and the manifest
records what the *delivered* file measures.

**D7 — Compressed time is shown, not hidden.** The journal scene's recording
timer runs to 0:24 in under two seconds of film, so the compression is on
screen in the product's own UI.

**D8 — Three lengths, not four.** A 120 s cut needs a "variety" chapter this
product does not have material for without inventing more persona data.

## Gate mutation evidence

Each was broken on purpose, seen red, and restored (2026-10-06):

| gate | mutation | result |
|---|---|---|
| strings | named the wrong product file / key for 14 strings (the first run of the gate against the initial string table) | red, 14 failures, each naming the string |
| bars | made two beats 5.4 s and 4.6 s | red: "coach starts 0.400s off a bar line" |
| purity | added `transition: "all 0.2s"` to the button | red: "a CSS transition" |
| copy | changed a caption to "Plan by the moon, instantly." | red twice: uncleared, and banned claim |
| numbers | raised the demo deposit to 900 | red: deposit overshoots the target |

## Not yet judged by a human

- **Listening.** Nobody has heard the masters. What is measured: integrated
  loudness, true peak, the bed's bar-by-bar level (intro quiet, breakdown about
  5 dB down, cadence ringing out). What is not: whether the tune is pleasant,
  whether the effects sit well, whether the ending resolves.
- **Te reo.** The eyebrow "Kōrero" and the film's use of product terms should
  be checked by someone with the standing to check them.
- **Film-voice copy.** Six captions are marked pending in
  `docs/copy-clearance.md`.
