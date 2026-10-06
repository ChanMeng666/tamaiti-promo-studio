# Copy clearance

Every word the **film** says (as opposed to the product's own interface, which is
covered by the strings gate) has a row here. `npm run verify` reads this file
and fails on any film-voice line that is not in it.

Status meanings: **product** = the product already says this, verbatim;
**film** = written for this film and awaiting the owner's sign-off.

| On-screen text | Source | Status |
|---|---|---|
| Financial wellness that weaves Māori wisdom with AI. | `app/layout.tsx` meta description and `og/og-cover.html` in the product repo | product |
| Whakataukī | Product term (dashboard proverb, `db/schema/whakatauki.ts`) | product term |
| Begin each day with a proverb and a check-in. | Describes the dashboard: the day's whakataukī and the morning check-in | film — pending owner sign-off |
| Maramataka | Product term (nav item, `/maramataka`) | product term |
| Plan by the moon, one night at a time. | Describes the Maramataka calendar and its per-day guidance | film — pending owner sign-off |
| Whāinga | Product term for goals (`app/i18n/pages/goals.ts`) | product term |
| Choose one of seven action plans. Watch the goal grow. | The wizard's seven options (a–g) and the savings overview | film — pending owner sign-off |
| Hauora | Product term (Te Whare Tapa Whā wellbeing model) | product term |
| Say your intentions aloud. The journal fills itself in. | Voice input plus the "Journal Filler" assistant, whose own opening line says it fills the fields | film — pending owner sign-off |
| Kōrero | Te reo Māori for talk / conversation; labels the voice coach scene | film — pending owner sign-off (te reo check) |
| Talk money through with a voice coach. | The AI Financial & Cultural Coach's real-time voice session | film — pending owner sign-off |
| Whānau | Product term (support network) | product term |
| Bring your whānau along. You choose what they see. | The support network and its per-supporter permission switches | film — pending owner sign-off |
| tamaiti.whiri-ai.com | Production URL, `docs/showcase/showcase.scenario.json` in the product repo | product |
| Interface recreated in code for this film. Demo account and figures are illustrative. | Disclosure: the picture is a coded replica and the persona is fictional | film — required |

Line-break variants of the same sentences (the vertical cut breaks lines
differently) are the same text and are matched with the breaks joined by a
space:

- Financial wellness that weaves Māori wisdom with AI.
- Begin each day with a proverb and a check-in.
- Plan by the moon, one night at a time.
- Choose one of seven action plans. Watch the goal grow.
- Say your intentions aloud. The journal fills itself in.
- Talk money through with a voice coach.
- Bring your whānau along. You choose what they see.
- Interface recreated in code for this film. Demo account and figures are illustrative.

## What the film deliberately does not say

- No speed claims, no outcome promises, nothing that reads as financial advice.
- No currency figure in the film's own voice. The only dollar amounts on screen
  are inside the replica and belong to the fictional demo persona.
- No invented AI output: the coach scene shows only the two lines the product
  itself scripts (its automatic first message and its prompted greeting).
