import { z } from "zod/v4";

// Дроби — только строка ("3/10"), см. bobr-fractions. Числовые поля без .min/.max: границы проверяет код после parse.
// Значения union продублированы в convex/schema.ts (convex/ не импортирует из lib/) — менять в обоих местах.

/** Enum без учёта регистра: вход приводится к каноническому написанию из списка, иначе остаётся как есть и не пройдёт z.enum. */
const ci = <const T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(
    (x) => (typeof x === "string" ? (values.find((c) => c.toLowerCase() === x.trim().toLowerCase()) ?? x) : x),
    z.enum(values),
  );

export const STATES = [
  "ONBOARD_CONSENT", "GOAL_SETUP", "DIAGNOSE", "PLAN", "HOME", "LESSON_INTRO", "LESSON_SOLVE", "TEACH_BOBR",
  "JUDGING", "BOBR_ATTEMPT", "BOBR_QUESTION", "TOPIC_DONE", "REVIEW_FORGOTTEN", "MIXED_CHECK", "CHAT", "CRISIS",
] as const;
export type ConvState = (typeof STATES)[number];

export const TOPIC_IDS = ["N1", "N2", "N3", "N4", "N5", "N6", "N7", "N8", "N9", "N10"] as const;
export type TopicId = (typeof TOPIC_IDS)[number];

export const TOPIC_LEVELS = ["gap", "solved_self", "taught_bobr"] as const; // нет строки = unknown
export type TopicLevel = (typeof TOPIC_LEVELS)[number];

export const HOUSE_STATES = ["empty", "scaffold", "built", "alive", "dimmed"] as const;
export type HouseState = (typeof HOUSE_STATES)[number];

export const LANGS = ["uz", "ru"] as const;
export type Lang = (typeof LANGS)[number];

// ── Вход хода: action turn {sessionId, input} ──
export const TURN_INPUT_TYPES = ["answer", "button", "text", "action"] as const;
export type TurnInput = { type: (typeof TURN_INPUT_TYPES)[number]; value: string; intent?: string };

// TODO(spec): список событий ответа хода {events[], state, houses} спека не задаёт — минимальный набор.
export type TurnEvent =
  | { type: "transition"; from: ConvState; to: ConvState }
  | { type: "topicLevel"; topic: TopicId; level: TopicLevel }
  | { type: "house"; topic: TopicId; state: HouseState };

// ── Компонент: {type, params}; params — строки (дроби строкой) ──
// TODO(spec): точные params для pie/strip/line спека не описывает.
export const Component = z.object({
  type: ci(["pie", "strip", "line"]),
  params: z.record(z.string(), z.string()),
});

// ── Zod-схемы из спеки ──
// TODO(spec): значения intent у Ustoz не перечислены — z.string().
export const UstozTurn = z.object({
  reply: z.string(),
  intent: z.string(),
  component: Component.nullable(),
  hintLevel: z.number(),
  revealsAnswer: z.boolean(),
});
export type UstozTurn = z.infer<typeof UstozTurn>;

// quote обязана быть подстрокой текста ребёнка — проверяет код, не схема.
// TODO(spec): значения verdict спека не перечисляет (упомянут partial) — pass/partial/fail.
export const Judge = z.object({
  ideas: z.array(z.object({ id: z.string(), found: z.boolean(), quote: z.string() })),
  falseClaims: z.array(z.string()),
  verdict: ci(["pass", "partial", "fail"]),
  copiedFromUstoz: z.boolean(),
});
export type Judge = z.infer<typeof Judge>;

// Позы — из 02_BUILD_KICKOFF (public/bobr). TODO(spec): emotion спека не перечисляет — z.string().
export const BOBR_POSES = ["idle", "think", "confused", "happy", "aha", "proud", "sad", "wave"] as const;
// attempt всегда перезаписывает код (дробь строкой); то, что вернула модель, не используется.
export const BobrTurn = z.object({
  reply: z.string(),
  emotion: z.string(),
  pose: ci(BOBR_POSES),
  attempt: z.string(),
});
export type BobrTurn = z.infer<typeof BobrTurn>;

export const PERSONA_VIOLATIONS = [
  "claims_human_or_alive", "romance", "missed_you_dont_leave", "secrets", "photo", "url",
] as const;
export const OutputCheck = z.object({
  ok: z.boolean(),
  violatesPersona: z.array(ci(PERSONA_VIOLATIONS)),
  // TODO(spec): прочие поля outputCheck (ПДн, утечка ответа) спека не задаёт.
});
export type OutputCheck = z.infer<typeof OutputCheck>;

// TODO(spec): значения intent кнопок цели — по спеке «скоро контрольная / домашка / не знаю».
export const GOAL_INTENTS = ["test_soon", "homework", "unknown"] as const;
export const GoalDialog = z.object({
  reply: z.string(),
  buttons: z.array(z.object({ label: z.string(), intent: ci(GOAL_INTENTS) })),
  extracted: z.object({ goal: ci(GOAL_INTENTS).nullable(), testDate: z.string().nullable() }),
});
export type GoalDialog = z.infer<typeof GoalDialog>;

export const GUARD_CATEGORIES = [
  "SELF_HARM", "ABUSE_HOME", "BULLYING", "VIOLENCE", "SEXUAL", "GROOMING", "PII", "DANGEROUS",
  "DEPENDENCY", "JAILBREAK", "ANSWER_EXTRACTION", "OFF_TOPIC_UNSAFE", "SAFE",
] as const;
export type GuardCategory = (typeof GUARD_CATEGORIES)[number];
// severity: число (sev1 и выше), границы проверяет код. Гипербола («zerikib o'ldim») → SAFE / sev1.
export const GuardResult = z.object({ category: ci(GUARD_CATEGORIES), severity: z.number() });
export type GuardResult = z.infer<typeof GuardResult>;
