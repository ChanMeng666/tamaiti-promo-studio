import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

// latin-ext carries the macrons (ā ē ī ō ū) te reo Māori is written with.
// Narrowed on purpose: an unnarrowed import fetches every weight and subset in
// every render worker.
const inter = loadInter("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin", "latin-ext"] });
const fraunces = loadFraunces("normal", { weights: ["500", "600"], subsets: ["latin", "latin-ext"] });

export const FILM_FONT = {
  /** the product's own face (app/layout.tsx loads Inter and nothing else) */
  ui: `${inter.fontFamily}, "Segoe UI", sans-serif`,
  /** the film's voice: a warm serif, so a caption is never mistaken for UI */
  voice: `${fraunces.fontFamily}, Georgia, serif`,
};
