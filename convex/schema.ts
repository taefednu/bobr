import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Таблицы по docs/BOBR_SPEC.md → «Бэкенд: Convex». Дроби везде — v.string() ("3/10"), никогда number/BigInt.
// Значения union дублируют lib/types.ts (convex/ не импортирует из lib/): менять в обоих местах.

const lang = v.union(v.literal("uz"), v.literal("ru"));
const topicId = v.string(); // "N1".."N10"; проверка по content/graph.json в коде
const topicLevel = v.union(v.literal("gap"), v.literal("solved_self"), v.literal("taught_bobr"));
const houseState = v.union(
  v.literal("empty"), v.literal("scaffold"), v.literal("built"), v.literal("alive"), v.literal("dimmed"),
);
const convState = v.union(
  v.literal("ONBOARD_CONSENT"), v.literal("GOAL_SETUP"), v.literal("DIAGNOSE"), v.literal("PLAN"),
  v.literal("HOME"), v.literal("LESSON_INTRO"), v.literal("LESSON_SOLVE"), v.literal("TEACH_BOBR"),
  v.literal("JUDGING"), v.literal("BOBR_ATTEMPT"), v.literal("BOBR_QUESTION"), v.literal("TOPIC_DONE"),
  v.literal("REVIEW_FORGOTTEN"), v.literal("MIXED_CHECK"), v.literal("CHAT"), v.literal("CRISIS"),
);
const guardCategory = v.union(
  v.literal("SELF_HARM"), v.literal("ABUSE_HOME"), v.literal("BULLYING"), v.literal("VIOLENCE"),
  v.literal("SEXUAL"), v.literal("GROOMING"), v.literal("PII"), v.literal("DANGEROUS"),
  v.literal("DEPENDENCY"), v.literal("JAILBREAK"), v.literal("ANSWER_EXTRACTION"),
  v.literal("OFF_TOPIC_UNSAFE"), v.literal("SAFE"),
);

export default defineSchema({
  students: defineTable({
    lang,
    parentId: v.optional(v.id("parents")),
    consent: v.boolean(), // экран раскрытия ИИ / согласие пройдены
    goal: v.optional(v.union(v.literal("test_soon"), v.literal("homework"), v.literal("unknown"))),
    testDate: v.optional(v.string()), // ISO "2026-12-01"; для planner
    state: convState, // стейт урока; CRISIS — оверлей, не заменяет его (см. crisisUntil)
    stateBeforeCrisis: v.optional(convState),
    currentTopic: v.optional(topicId),
    // TODO(spec): имя ребёнка не храним — ПДн; ник/аватар в спеке не описан.
    chatBlockedUntil: v.optional(v.number()), // ms; CRISIS блокирует только болталку на 24 ч
    chatDay: v.optional(v.string()), // "YYYY-MM-DD" локального дня для лимита 30 мин/день
    chatMsToday: v.optional(v.number()),
    riskCount: v.number(), // счётчик рисков сессии для guard
  }).index("by_parent", ["parentId"]),

  // Нет строки = unknown (дом empty).
  topicStatus: defineTable({
    studentId: v.id("students"),
    topic: topicId,
    level: topicLevel,
    streak: v.number(), // верных вводом подряд без подсказок; 3 → solved_self
    tasksThisSession: v.number(), // не больше 8 за сессию
    bobrQuestionRounds: v.number(), // BOBR_QUESTION ≤ 3 кругов
    solvedSelfAt: v.optional(v.number()),
    taughtAt: v.optional(v.number()), // ≥ 7 дней → dimmed
    lastReviewedAt: v.optional(v.number()),
  })
    .index("by_student", ["studentId"])
    .index("by_student_and_topic", ["studentId", "topic"]),

  plans: defineTable({
    studentId: v.id("students"),
    testDate: v.optional(v.string()),
    days: v.array(v.object({
      date: v.string(), // ISO
      newTopics: v.array(topicId), // ≤ 2 в день
      reviewTopics: v.array(topicId), // review-слот для taught ≥ 7 дней
      mixedCheck: v.boolean(), // в день перед датой
    })),
  }).index("by_student", ["studentId"]),

  // Производная от topicStatus через houseMapper, хранится для живых подписок родителя.
  houses: defineTable({
    studentId: v.id("students"),
    topic: topicId,
    state: houseState,
  })
    .index("by_student", ["studentId"])
    .index("by_student_and_topic", ["studentId", "topic"]),

  // Только маскированный текст (ПДн заменены до записи), хранится 30 дней.
  turns: defineTable({
    studentId: v.id("students"),
    sessionId: v.string(),
    role: v.union(v.literal("child"), v.literal("ustoz"), v.literal("bobr"), v.literal("system")),
    kind: v.union(v.literal("answer"), v.literal("button"), v.literal("text"), v.literal("action"), v.literal("reply")),
    text: v.string(), // маскированный
    state: convState,
    ts: v.number(), // ms; ключ для антиповтора (последние 20–30 реплик) и чистки по 30 дням
  })
    .index("by_session_and_ts", ["sessionId", "ts"])
    .index("by_student_and_ts", ["studentId", "ts"]),

  // Флаги guard (хранятся 90 дней). ABUSE_HOME — родителю не сообщаем.
  reviewQueue: defineTable({
    studentId: v.id("students"),
    category: guardCategory,
    severity: v.number(),
    status: v.union(v.literal("open"), v.literal("reviewed"), v.literal("dismissed")),
    notifyParent: v.boolean(), // false для ABUSE_HOME
    // TODO(spec): хранить ли маскированный фрагмент для ревью — спека молчит; без цитат (SELF_HARM).
  })
    .index("by_status", ["status"])
    .index("by_student", ["studentId"]),

  parents: defineTable({
    lang,
    linkCode: v.optional(v.string()), // код привязки к ребёнку
    telegramChatId: v.optional(v.string()),
    longGoal: v.optional(v.string()), // «долгую цель ставит родитель»; TODO(spec): формат цели
  })
    .index("by_link_code", ["linkCode"])
    .index("by_telegram_chat", ["telegramChatId"]),

  // Контент из content/ (граф, шаблоны, заблуждения), загруженный в БД. TODO(spec): форма data.
  content: defineTable({
    key: v.string(),
    version: v.number(),
    data: v.any(),
  }).index("by_key", ["key"]),

  // Офлайн-пул переписанных сюжетов; числа в text только цифрами (numberCheck).
  worldsPool: defineTable({
    world: v.string(), // "kitchen" | "space" | "animals"; TODO(spec): полный список миров
    topic: topicId,
    templateId: v.string(),
    lang,
    text: v.string(),
  }).index("by_world_and_topic_and_lang", ["world", "topic", "lang"]),

  // REPLAY: ключ (step, beat, itemId, lang[, normInput]) склеен в key.
  llmCache: defineTable({
    key: v.string(),
    step: v.string(),
    response: v.string(), // JSON после zod
  }).index("by_key", ["key"]),
});
