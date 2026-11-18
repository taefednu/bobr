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
  closedGuardPerHour: 10, // проверки guard на сообщения в закрытый чат: кризис ловим, но модель не тратим без предела
} as const;

export const THRESHOLDS = {
  copyCheck: { jaccardOver: 0.5, lastUstozLines: 6 },
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

/** DEMO_MODE (env Convex): `replay` — ответы только из llmCache, даже при ключе (офлайн-демо). Иначе live; без ключа live невозможен → replay. */
export const resolveDemoMode = (mode: string | undefined, hasKey: boolean): "live" | "replay" =>
  !hasKey || mode === "replay" ? "replay" : "live";
/** DEMO_MODE=script — диагностика идёт по фиксированным пробам DEMO_PROBE_ORDER; иначе адаптивная. На live/replay LLM не влияет
 *  (script с ключом = live). Вердикты в обоих режимах считает код по ответу ребёнка. */
export const isScriptDiagnosis = (mode: string | undefined): boolean => mode === "script";
// Цель диагностики и плана на хакатон — сложение с разными знаменателями (демо-путь спеки). maxProbes — потолок адаптивной ветки.
export const DIAGNOSE = { targets: ["N9"], maxProbes: 6 } as const;
export const SESSION_DAYS = 30; // детская сессия (ТЗ срок не задаёт)
export const DEMO_PROBE_ORDER = ["N9", "N8", "N2", "N5", "N6", "N1"] as const;
