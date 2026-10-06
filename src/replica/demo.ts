/**
 * The demo persona — the film's INPUTS, and the only invented content in it.
 *
 * Everything a real user would type or own (a name, a goal, amounts, who
 * supports them) has to come from somewhere, and the product's database holds
 * real people's entries that must never appear in a film. So the persona is
 * fictional and lives in this one file. Everything else on screen — labels,
 * lunar days, proverbs, option lists, example journal text — is read from the
 * product. The end card says so.
 *
 * `npm run verify` checks that every figure the film shows is declared here
 * or in the baked product data.
 */
export const DEMO = {
  user: { name: "Aroha Tane", email: "aroha@example.com", initials: "AT" },
  /** the day the dashboard is "today": a real date in the product's lunar table */
  today: { iso: "2025-06-11", label: "Wednesday, 11 June 2025", dayOfMonth: 11 },
  mood: { pickIndex: 3, energyFrom: 3, energyTo: 4 },
  goal: {
    typeCode: "emergency_fund",
    objective: "Build a whānau emergency fund",
    plan: "b" as const,
    baseline: 800,
    current: 1250,
    target: 2000,
    deposit: 150,
    daysLeft: 84,
    /** savings history for the growth chart, oldest first; the deposit extends it */
    history: [800, 880, 950, 1040, 1120, 1250],
  },
  supporters: [
    { name: "Mere Tane", initials: "MT", role: "whanau" as const, email: "mere@example.com" },
    { name: "Hemi Walker", initials: "HW", role: "mentor" as const, email: "hemi@example.com" },
    { name: "Tama Rangi", initials: "TR", role: "friend" as const, email: "tama@example.com" },
  ],
  support: {
    stats: { network: 3, newMessages: 2, encouragements: 5, thisWeek: 4 },
    activity: [
      { who: "Mere Tane", what: "sent you encouragement", kind: "heart" as const, ago: "2h ago", isNew: true },
      { who: "Hemi Walker", what: "celebrated your milestone", kind: "target" as const, ago: "1d ago", isNew: false },
    ],
    lastUpdated: "11 June 2025",
  },
  coach: { timeUser: "9:41:07 AM", timeCoach: "9:41:09 AM" },
  journal: { date: "11/06/2025", recordSec: 24, completeTo: 44 },
} as const;
