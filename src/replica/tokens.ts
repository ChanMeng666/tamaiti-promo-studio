/**
 * The product's palette. Theme tokens are the values in the product's
 * app/globals.css (light theme); the colour families are Tailwind's defaults,
 * which is what the product's utility classes resolve to.
 */
export const C = {
  bg: "#ffffff",
  fg: "#0a0a0a",
  primary: "#10b981", // "Pounamu Green", globals.css --primary
  primaryFg: "#fafafa",
  muted: "#f5f5f5",
  mutedFg: "#737373",
  border: "#e5e5e5",
  destructive: "#e7000b",
  green: { 50: "#f0fdf4", 100: "#dcfce7", 200: "#bbf7d0", 300: "#86efac", 400: "#4ade80", 500: "#22c55e", 600: "#16a34a", 700: "#15803d", 800: "#166534", 900: "#14532d" },
  blue: { 50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a" },
  yellow: { 50: "#fefce8", 200: "#fef08a", 400: "#facc15", 500: "#eab308", 600: "#ca8a04" },
  gray: { 50: "#f9fafb", 200: "#e5e7eb", 300: "#d1d5db", 400: "#9ca3af", 500: "#6b7280", 600: "#4b5563", 700: "#374151", 800: "#1f2937" },
  amber: { 50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 500: "#f59e0b", 600: "#d97706", 800: "#92400e" },
  emerald: { 50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 500: "#10b981" },
  purple: { 50: "#faf5ff", 200: "#e9d5ff", 500: "#a855f7", 600: "#9333ea", 700: "#7e22ce", 800: "#6b21a8" },
  red: { 50: "#fef2f2", 200: "#fecaca", 500: "#ef4444", 600: "#dc2626" },
  orange: { 50: "#fff7ed", 200: "#fed7aa", 600: "#ea580c" },
  indigo: { 50: "#eef2ff", 200: "#c7d2fe", 600: "#4f46e5", 700: "#4338ca", 900: "#312e81" },
  slate: { 50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0" },
  moonDark: "#424042",
  moonLight: "#F4F0EB",
  orb: "#4EB94C", // the fill inside public/animations/realtime-speaking.lottie
} as const;

/** `text-* bg-* border-*` energy classes → colours (maramataka-service getEnergyLevelColor). */
export const energyColours = (classes: string): { fg: string; bg: string; border: string } => {
  const fam = /text-(\w+)-600/.exec(classes)?.[1] as "green" | "yellow" | "blue" | "gray" | undefined;
  const f = C[fam ?? "gray"] as Record<number, string>;
  return { fg: f[600], bg: f[50], border: f[200] };
};

export const shadow = {
  xs: "0 1px 2px rgba(0,0,0,0.05)",
  sm: "0 1px 3px rgba(0,0,0,0.10), 0 1px 2px -1px rgba(0,0,0,0.10)",
  md: "0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.10)",
  lg: "0 10px 15px -3px rgba(0,0,0,0.10), 0 4px 6px -4px rgba(0,0,0,0.10)",
  xl: "0 20px 25px -5px rgba(0,0,0,0.10), 0 8px 10px -6px rgba(0,0,0,0.10)",
};
