/**
 * Every product word the replica shows, in one place.
 *
 * Two kinds:
 *
 *   tr("dashboard.header.greeting", lang)   read from the product's own i18n
 *                                           tables, baked by `npm run bake`
 *
 *   S.<name>                                strings the product hard-codes in a
 *                                           component. Each names the product
 *                                           file it mirrors, and `npm run
 *                                           verify` reads that file and asserts
 *                                           the literal is in it.
 *
 * A string the product does not say is a lie about the product. When the
 * strings gate goes red after a product change: fix this file, not the gate.
 */

import product from "./data/product.generated.json";

export type Lang = "mi" | "en";

type Leaf = { mi: string; en: string };
const isLeaf = (v: unknown): v is Leaf =>
  typeof v === "object" && v !== null && typeof (v as Leaf).en === "string" && typeof (v as Leaf).mi === "string";

/** Look up a product translation. Total: an unknown key returns a visible marker, and a gate fails on it. */
export const tr = (key: string, lang: Lang): string => {
  let node: unknown = product.i18n;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return `⟦${key}⟧`;
    node = (node as Record<string, unknown>)[part];
  }
  return isLeaf(node) ? node[lang] : `⟦${key}⟧`;
};

const s = <T extends string>(text: T, src: string) => ({ text, src });

export const S = {
  // ── headers ──
  appName: s("TAM-AI-TI", "app/components/GlobalHeader.tsx"),
  publicName: s("Tam-AI-ti", "app/i18n/navigation.ts"),
  navGoals: s("Goals", "app/components/Navigation.tsx"),
  navJournal: s("Journal", "app/components/Navigation.tsx"),
  navCoach: s("AI Coach", "app/components/Navigation.tsx"),
  navMaramataka: s("Maramataka", "app/components/Navigation.tsx"),
  navAssessment: s("Assessment", "app/components/Navigation.tsx"),
  navSupport: s("Support", "app/components/Navigation.tsx"),
  navResources: s("Resources", "app/components/Navigation.tsx"),

  // ── dashboard: MaramatakaCard ──
  todaysMaramataka: s("Today's Maramataka", "app/dashboard/components/MaramatakaCard.tsx"),
  fullMoon: s("Full Moon", "app/dashboard/components/MaramatakaCard.tsx"),
  highProductivity: s("High Productivity", "app/dashboard/components/MaramatakaCard.tsx"),
  fishing: s("Fishing", "app/dashboard/components/MaramatakaCard.tsx"),
  planting: s("Planting", "app/dashboard/components/MaramatakaCard.tsx"),
  good: s("Good", "app/dashboard/components/MaramatakaCard.tsx"),
  maramatakaDay: s("Maramataka Day", "app/dashboard/components/MaramatakaCard.tsx"),
  daysToNewCycle: s("days to new cycle", "app/dashboard/components/MaramatakaCard.tsx"),
  viewMaramataka: s("View Maramataka", "app/dashboard/components/MaramatakaCard.tsx"),

  // ── dashboard: DailyWellnessTracker ──
  howAreYou: s("Kei te pēhea koe?", "app/dashboard/components/DailyWellnessTracker.tsx"),
  periodAta: s("ata", "app/dashboard/components/DailyWellnessTracker.tsx"),
  morningEmoji: s("🌅 Morning", "app/dashboard/components/DailyWellnessTracker.tsx"),
  checkIn: s(" Check-in", "app/dashboard/components/DailyWellnessTracker.tsx"),
  piropiro: s("Kei te pehea o piropiro", "app/dashboard/components/DailyWellnessTracker.tsx"),
  moodHoha: s("Hoha", "app/dashboard/components/DailyWellnessTracker.tsx"),
  moodTakeo: s("Takeo", "app/dashboard/components/DailyWellnessTracker.tsx"),
  moodTapatahi: s("Tapatahi", "app/dashboard/components/DailyWellnessTracker.tsx"),
  moodPai: s("Pai", "app/dashboard/components/DailyWellnessTracker.tsx"),
  moodWehi: s("Ka mau te wehi!", "app/dashboard/components/DailyWellnessTracker.tsx"),
  moodVeryLow: s("Very Low", "app/dashboard/components/DailyWellnessTracker.tsx"),
  moodLow: s("Low", "app/dashboard/components/DailyWellnessTracker.tsx"),
  moodNeutral: s("Neutral", "app/dashboard/components/DailyWellnessTracker.tsx"),
  moodGood: s("Good", "app/dashboard/components/DailyWellnessTracker.tsx"),
  moodGreat: s("Great", "app/dashboard/components/DailyWellnessTracker.tsx"),
  energyLevel: s("Energy Level", "app/dashboard/components/DailyWellnessTracker.tsx"),
  energyNgoikore: s("Ngoikore", "app/dashboard/components/DailyWellnessTracker.tsx"),
  energyOkay: s("Okay", "app/dashboard/components/DailyWellnessTracker.tsx"),
  energyPakahukahu: s("Pākahukahu", "app/dashboard/components/DailyWellnessTracker.tsx"),
  saveWord: s("Save ", "app/dashboard/components/DailyWellnessTracker.tsx"),
  morning: s("Morning", "app/dashboard/components/DailyWellnessTracker.tsx"),
  checkInSaved: s("check-in saved successfully!", "app/dashboard/components/DailyWellnessTracker.tsx"),

  // ── dashboard: SavingsDashboardWidget ──
  savingsGoal: s("Savings Goal", "app/dashboard/components/widgets/SavingsDashboardWidget.tsx"),
  current: s("Current", "app/dashboard/components/widgets/SavingsDashboardWidget.tsx"),
  saved: s("Saved", "app/dashboard/components/widgets/SavingsDashboardWidget.tsx"),
  progressWord: s("% progress", "app/dashboard/components/widgets/SavingsDashboardWidget.tsx"),
  daysLeftToGo: s(" days left. $", "app/dashboard/components/widgets/SavingsDashboardWidget.tsx"),
  toGo: s(" to go!", "app/dashboard/components/widgets/SavingsDashboardWidget.tsx"),
  update: s("Update", "app/dashboard/components/widgets/SavingsDashboardWidget.tsx"),
  details: s("Details", "app/dashboard/components/widgets/SavingsDashboardWidget.tsx"),

  // ── maramataka page ──
  aboutMaramataka: s("About Maramataka", "app/maramataka/components/InfoModal.tsx"),
  legendEnergy: s("Energy:", "app/maramataka/components/MonthView.tsx"),
  legendHigh: s("High", "app/maramataka/components/MonthView.tsx"),
  legendMedium: s("Medium", "app/maramataka/components/MonthView.tsx"),
  legendLow: s("Low", "app/maramataka/components/MonthView.tsx"),
  legendNone: s("None", "app/maramataka/components/MonthView.tsx"),
  legendSpecial: s("Special:", "app/maramataka/components/MonthView.tsx"),
  legendNewMoon: s("New Moon", "app/maramataka/components/MonthView.tsx"),
  legendFullMoon: s("Full Moon", "app/maramataka/components/MonthView.tsx"),
  legendDoubleDay: s("Double Day", "app/maramataka/components/MonthView.tsx"),
  dayDetails: s("Maramataka Day Details", "app/maramataka/components/MonthView.tsx"),
  fullMoonBadge: s("Full Moon - Te Rākaunui", "app/maramataka/components/DayDetail.tsx"),
  lunarCyclePosition: s("Lunar Cycle Position", "app/maramataka/components/DayDetail.tsx"),
  dayOfCycle: s("Day of Cycle", "app/maramataka/components/DayDetail.tsx"),
  daysToNew: s("Days to New Cycle", "app/maramataka/components/DayDetail.tsx"),
  dailyGuidance: s("Daily Guidance", "app/maramataka/components/DayDetail.tsx"),
  traditionalActivities: s("Traditional Activities", "app/maramataka/components/DayDetail.tsx"),
  naturalConditions: s("Natural Conditions", "app/maramataka/components/DayDetail.tsx"),
  fishingWord: s("Fishing ", "app/maramataka/components/DayDetail.tsx"),
  plantingWord: s("Planting ", "app/maramataka/components/DayDetail.tsx"),
  goodWord: s("Good", "app/maramataka/components/DayDetail.tsx"),

  // ── goals: the wizard's action plan step ──
  stepWord: s("Step ", "app/goals/components/GoalWizardProgress.tsx"),
  ofWord: s(" of ", "app/goals/components/GoalWizardProgress.tsx"),
  completeWord: s("% Complete", "app/goals/components/GoalWizardProgress.tsx"),
  actionPlanSelection: s("Action Plan Selection", "app/goals/components/GoalActionPlanStep.tsx"),
  chooseOne: s("Choose one option that aligns with your objectives:", "app/goals/components/GoalActionPlanStep.tsx"),
  iWantTo: s("I want to ", "app/goals/components/GoalActionPlanStep.tsx"),
  optA: s("Reduce Discretionary Spend", "app/goals/components/GoalActionPlanStep.tsx"),
  optB: s("Increase Savings Total", "app/goals/components/GoalActionPlanStep.tsx"),
  optC: s("Increase Savings Rate", "app/goals/components/GoalActionPlanStep.tsx"),
  optD: s("Reduce Debt", "app/goals/components/GoalActionPlanStep.tsx"),
  optE: s("Adjust Income", "app/goals/components/GoalActionPlanStep.tsx"),
  optF: s("Review Budget Regularly", "app/goals/components/GoalActionPlanStep.tsx"),
  optG: s("Meet with Accountability Partner", "app/goals/components/GoalActionPlanStep.tsx"),
  optADesc: s("reduce my discretionary spending from $[amount] per [frequency] to $[amount] per [frequency] by 28 February 2026", "app/goals/components/GoalActionPlanStep.tsx"),
  optBDesc: s("increase my total savings from $[amount] on 1 November 2025 to $[amount] on 28 February 2026", "app/goals/components/GoalActionPlanStep.tsx"),
  optCDesc: s("increase my savings rate from $[amount] per [frequency] to $[amount] per [frequency] by 28 February 2026", "app/goals/components/GoalActionPlanStep.tsx"),
  optDDesc: s("reduce my debt from $[amount] on 1 November 2025 to $[amount] on 28 February 2026", "app/goals/components/GoalActionPlanStep.tsx"),
  optEDesc: s("adjust my income from $[amount] per [frequency] to $[amount] per [frequency] by 28 February 2026", "app/goals/components/GoalActionPlanStep.tsx"),
  optFDesc: s("review my budget [frequency] starting from 1 November 2025. Currently, I do this [current frequency]", "app/goals/components/GoalActionPlanStep.tsx"),
  optGDesc: s("meet with my accountability partner [frequency] starting from 1 November 2025. Currently, I meet with them [current frequency]", "app/goals/components/GoalActionPlanStep.tsx"),

  // ── goals: the savings overview ──
  recordSavings: s("Record Savings", "app/components/goals/overview/SavingsOverview.tsx"),
  amountSaved$: s("Amount Saved ($) *", "app/components/goals/overview/SavingsOverview.tsx"),
  currentSavings: s("Current Savings", "app/components/goals/overview/SavingsOverview.tsx"),
  target: s("Target", "app/components/goals/overview/SavingsOverview.tsx"),
  amountSaved: s("Amount Saved", "app/components/goals/overview/SavingsOverview.tsx"),
  stillToSave: s("Still to Save", "app/components/goals/overview/SavingsOverview.tsx"),
  savingsSource: s("Savings Source *", "app/components/goals/overview/SavingsOverview.tsx"),
  sourceDeposit: s("Deposit/Transfer In", "app/components/goals/overview/SavingsOverview.tsx"),
  dateLabel: s("Date *", "app/components/goals/overview/SavingsOverview.tsx"),
  amountHelper: s("Enter the amount you saved (will be added to your total)", "app/components/goals/overview/SavingsOverview.tsx"),
  growthTitle: s("Savings Growth Over Time", "app/components/goals/overview/SavingsOverview.tsx"),
  growthSub: s("Track your savings journey from baseline to target", "app/components/goals/overview/SavingsOverview.tsx"),

  // ── journal ──
  journalFillerTitle: s("Journal Filler | Kaiwhakakī", "app/config/copilot-routes.config.ts"),
  journalFillerInitial: s("Kia ora! Share your journal content with me, and I'll intelligently fill it into the right fields. Just provide your text, and I'll parse it faithfully without modification.", "app/config/copilot-routes.config.ts"),
  voiceTranscribed: s("Voice Transcribed", "app/components/VoiceInputButton.tsx"),
  copiedHint: s("Copied to clipboard! Paste it into the chat.", "app/components/VoiceInputButton.tsx"),

  // ── coach ──
  coachTitle: s("AI Financial & Cultural Coach", "app/(routes)/financial-coach/page.tsx"),
  viewHistory: s("View History", "app/(routes)/financial-coach/page.tsx"),
  sessionControl: s("Session Control", "app/components/financial-coach/ai-financial-coach.tsx"),
  startPractice: s("Start Practice", "app/components/financial-coach/ai-financial-coach.tsx"),
  connecting: s("Connecting...", "app/components/financial-coach/ai-financial-coach.tsx"),
  endPractice: s("End Practice", "app/components/financial-coach/ai-financial-coach.tsx"),
  requestResponse: s("Request Response", "app/components/financial-coach/ai-financial-coach.tsx"),
  notConnected: s("Not Connected", "app/components/financial-coach/ai-financial-coach.tsx"),
  connected: s("Connected", "app/components/financial-coach/ai-financial-coach.tsx"),
  listening: s("Listening...", "app/components/financial-coach/ai-financial-coach.tsx"),
  transcript: s("Conversation Transcript", "app/components/financial-coach/ai-financial-coach.tsx"),
  startToBegin: s("Start a practice session to begin", "app/components/financial-coach/ai-financial-coach.tsx"),
  you: s("You", "app/components/financial-coach/ai-financial-coach.tsx"),
  aiCoach: s("AI Coach", "app/components/financial-coach/ai-financial-coach.tsx"),
  coachUserFirst: s("Kia ora! I'm ready to learn about financial wellbeing and Māori cultural wisdom.", "app/components/financial-coach/ai-financial-coach.tsx"),
  coachGreeting: s("Kia ora! Welcome. I'm your AI Financial and Cultural Coach. What would you like to explore today?", "app/components/financial-coach/ai-financial-coach.tsx"),

  // ── whānau ──
  roopuTautoko: s("Roopu Tautoko", "app/support/page.tsx"),
  roopuOptional: s("This is optional.", "app/support/page.tsx"),
  roopuPurpose: s(" The purpose of this roopu is to support you in achieving your goals. These are people that:", "app/support/page.tsx"),
} as const;

export type StringKey = keyof typeof S;
/** The text of a hard-coded product string. */
export const h = (key: StringKey): string => S[key].text;

/** Every `tr()` key the replica uses, so a gate can prove each one resolves. */
export const TR_KEYS = [
  "dashboard.header.greeting", "dashboard.header.tagline",
  "dashboard.journal.title", "dashboard.journal.morning.title", "dashboard.journal.morning.description",
  "dashboard.journal.morningManual.title", "dashboard.journal.morningManual.description",
  "maramataka.page.title", "maramataka.navigation.previous", "maramataka.navigation.next",
  "maramataka.navigation.jumpToMonth", "maramataka.calendar.badge",
  "goals.newGoal.title", "goals.newGoal.subtitle",
  "goals.newGoal.steps.goalType", "goals.newGoal.steps.fiveYearVision", "goals.newGoal.steps.oneYearGoal",
  "goals.newGoal.steps.actionPlan", "goals.newGoal.steps.celebration",
  "journal.page.title", "journal.page.viewHistory", "journal.page.complete", "journal.page.saveEntry", "journal.page.aiActive",
  "journal.types.morning", "journal.types.evening", "journal.types.morningTitle",
  "journal.morning.intentionsTitle", "journal.morning.intentionsDescription",
  "journal.morning.wairua.label", "journal.morning.wairua.subtitle",
  "journal.morning.tinana.label", "journal.morning.tinana.subtitle",
  "journal.morning.whanau.label", "journal.morning.whanau.subtitle",
  "journal.morning.hinengaro.label", "journal.morning.hinengaro.subtitle",
  "support.main.title", "support.main.subtitle",
  "support.main.stats.supportNetwork", "support.main.stats.newMessages",
  "support.main.stats.encouragements", "support.main.stats.thisWeek",
  "support.main.recentActivity.title", "support.main.recentActivity.newBadge",
  "support.main.roles.whanau", "support.main.roles.mentor", "support.main.roles.friend",
  "support.network.title", "support.network.subtitle",
  "support.network.tabs.privacy.full", "support.network.tabs.connections.full",
  "support.network.privacy.noticeTitle", "support.network.privacy.saveButton", "support.network.privacy.saved",
  "support.network.privacy.lastUpdated",
  "support.network.privacy.permissions.viewGoals.label", "support.network.privacy.permissions.viewGoals.description",
  "support.network.privacy.permissions.viewProgress.label", "support.network.privacy.permissions.viewProgress.description",
  "support.network.privacy.permissions.viewMood.label", "support.network.privacy.permissions.viewMood.description",
  "support.network.privacy.permissions.viewAchievements.label", "support.network.privacy.permissions.viewAchievements.description",
  "support.network.privacy.permissions.sendMessages.label", "support.network.privacy.permissions.sendMessages.description",
  "support.main.quickActions.messagesSupport.title", "support.main.quickActions.messagesSupport.description",
  "support.main.quickActions.inviteSupporters.title", "support.main.quickActions.inviteSupporters.description",
  "support.main.quickActions.privacySettings.title", "support.main.quickActions.privacySettings.description",
  "support.network.privacy.noticeDescription",
  "goals.detail.buttons.editGoal",
  "home.hero.cta",
] as const;
