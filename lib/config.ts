// Все числа и ID из docs/BOBR_SPEC.md. Менять только вместе со спекой.

export const MODELS = {
  guardIn: "claude-haiku-5-5",
  outputCheck: "claude-haiku-5-5",
  intentRoute: "claude-haiku-5-5",
  parentSummary: "claude-haiku-5-5",
  ustozTurn: "claude-sonnet-5-5",
  judge: "claude-sonnet-5-5", // ×1; при partial ещё 2 параллельно
  bobrTurn: "claude-haiku-5-5", // Sonnet, если носитель забракует узбекский
  bobrChat: "claude-haiku-5-5",
  goalDialog: "claude-haiku-5-5",
  worldRewrite: "claude-sonnet-5-5", // офлайн-пул
} as const;

export const TIMEOUTS_MS = { guard: 6_000, ustoz: 12_000, judge: 15_000, bobr: 6_000 } as const;
export const MAX_RETRIES = 1;

export const BREAKER = { errors: 3, windowMs: 30_000, statuses: [429, 529] } as const; // → режим «только задачи»

export const CHAT = {
  sessionMinutes: 15,
  dayMinutes: 30,
  closedFromHour: 21, // закрыта 21:00–07:00
  closedToHour: 7,
  crisisBlockHours: 24,
} as const;

export const THRESHOLDS = {
  copyCheck: { jaccardOver: 0.6, lastUstozLines: 6 },
  repeatGuard: { jaccardOver: 0.7, lastLines: 30 },
  preGuardMaxInput: 500,
} as const;

export const LESSON = {
  maxTasksPerTopicPerSession: 8,
  bobrQuestionMaxRounds: 3,
  solvedSelfStreak: 3,
  dimmedAfterDays: 7,
  maxNewTopicsPerDay: 2,
} as const;

export const CRISIS = {
  confirmedNumbers: ["112"],
  // Остальные номера не придумываем: проверить звонком, затем добавить.
  unverifiedNumbers: [] as readonly string[],
} as const;

export const DEMO_MODE = process.env.DEMO_MODE === "1";
export const DEMO_PROBE_ORDER = ["N9", "N8", "N2", "N5", "N6", "N1"] as const;
