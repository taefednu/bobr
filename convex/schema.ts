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
// дублирует GOAL_INTENTS из lib/types.ts (решение владельца 18.11: «Скоро контрольная / Подтянуть дроби / Просто заниматься»)
const goal = v.union(v.literal("test_soon"), v.literal("improve"), v.literal("just_practice"));
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
    goal: v.optional(goal),
    testDate: v.optional(v.string()), // ISO "2026-12-01"; для planner
    state: convState, // стейт урока; CRISIS — оверлей, не заменяет его (см. crisisUntil)
    stateBeforeCrisis: v.optional(convState),
    currentTopic: v.optional(topicId),
    // ДЕТСКИЕ ПДн (противоречие с правилом «ПДн не в БД», см. docs/specs/API_FOR_BOT.md): имя, которое родитель ввёл
    // в боте. Читают только функции родителя (parent.dashboard, notify* в outbox). НИКОГДА не в промпты LLM, turns,
    // llmCache и логи — это держит tests/displayNameGuard.test.ts.
    displayName: v.optional(v.string()),
    grade: v.optional(v.number()),
    chatBlockedUntil: v.optional(v.number()), // ms; CRISIS блокирует только болталку на 24 ч
    chatDay: v.optional(v.string()), // "YYYY-MM-DD" локального дня для лимита 30 мин/день
    chatMsToday: v.optional(v.number()),
    riskCount: v.number(), // счётчик рисков сессии для guard
    // Урок (этап 2). Задача целиком — ТОЛЬКО на сервере: answer/distractors наружу не отдаём (convex/lessonView.ts).
    // Все дроби — строки. Поля optional: старые строки без урока остаются валидными.
    currentTask: v.optional(v.object({
      id: v.string(),
      topic: v.string(),
      kind: v.string(), // TaskKind из lib/fractions/task.ts
      params: v.record(v.string(), v.string()),
      answer: v.string(),
      distractors: v.array(v.object({ value: v.string(), misconception: v.optional(v.string()) })),
      requireReduced: v.boolean(),
      numbersShown: v.array(v.string()),
    })),
    // Диагностика (этап 3). Текущая проба лежит в currentTask (kind "mcq", answer — только на сервере).
    // options — перемешанные варианты текущей пробы (в currentTask нет seed, пересчитать в query нельзя).
    diagnosis: v.optional(v.object({
      results: v.array(v.object({ topic: topicId, ok: v.boolean(), misconception: v.optional(v.string()) })),
      options: v.array(v.string()),
    })),
    turnNo: v.optional(v.number()), // растёт на каждый ход; реплика Ustoz пишется только при совпадении
    hintLevel: v.optional(v.number()), // 0..4, считает ТОЛЬКО код: кнопка +1, каждые 2 ошибки на задаче +1, новая задача → 0
    wrongOnTask: v.optional(v.number()), // ошибок на текущей задаче
    lastVerdict: v.optional(v.string()), // "ok" | "almost" | "misconception:M9" | "wrong" | "unparsed"
    lastReply: v.optional(v.object({
      turnNo: v.number(),
      reply: v.union(v.string(), v.null()),
      // дублирует Component из lib/types.ts: менять в обоих местах
      component: v.union(v.null(), v.object({
        type: v.union(v.literal("pie"), v.literal("strip"), v.literal("line")),
        params: v.array(v.object({ key: v.string(), value: v.string() })),
      })),
      hintButton: v.boolean(),
    })),
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
    .index("by_student_and_topic", ["studentId", "topic"]),

  plans: defineTable({
    studentId: v.id("students"),
    testDate: v.optional(v.string()),
    order: v.optional(v.array(topicId)), // порядок новых тем из buildPlan (в т.ч. не поместившиеся в дни)
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
    .index("by_student_and_topic", ["studentId", "topic"]),

  // Только маскированный текст (ПДн заменены до записи), хранится 30 дней.
  turns: defineTable({
    studentId: v.id("students"),
    sessionId: v.string(),
    role: v.union(v.literal("child"), v.literal("ustoz"), v.literal("bobr"), v.literal("system")),
    kind: v.union(v.literal("answer"), v.literal("button"), v.literal("text"), v.literal("action"), v.literal("reply")),
    text: v.string(), // маскированный
    pose: v.optional(v.string()), // поза реплики в чате (BOBR_POSES, прошла zod)
    turnNo: v.optional(v.number()), // номер хода ребёнка (для маски ПДн задним числом)
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
    withheldPush: v.optional(v.boolean()), // пуш родителю про SELF_HARM/GROOMING НЕ отправлен из-за ABUSE_HOME: ревьюеру смотреть первым
    // TODO(spec): хранить ли маскированный фрагмент для ревью — спека молчит; без цитат (SELF_HARM).
  })
    .index("by_status", ["status"])
    .index("by_student_and_category", ["studentId", "category"]),

  parents: defineTable({
    lang,
    linkCode: v.optional(v.string()), // устарело: коды живут в linkCodes
    telegramChatId: v.optional(v.string()),
    longGoal: v.optional(v.string()), // устарело: см. goal/testDate
    telegramUserId: v.optional(v.string()),
    firstName: v.optional(v.string()),
    consent: v.optional(v.boolean()), // родитель принял условия в боте
    goal: v.optional(goal),
    testDate: v.optional(v.string()), // ISO "YYYY-MM-DD"
  })
    .index("by_link_code", ["linkCode"])
    .index("by_telegram_chat", ["telegramChatId"])
    .index("by_telegram_user", ["telegramUserId"]),

  // Родитель ↔ ребёнок, многие-ко-многим (второй родитель). students.parentId — тот, кто создал.
  parentLinks: defineTable({ parentId: v.id("parents"), studentId: v.id("students") })
    .index("by_parent", ["parentId"])
    .index("by_student", ["studentId"]),

  // Одноразовый код привязки (24 ч). Хранится как есть: код короткий и живёт сутки.
  linkCodes: defineTable({
    code: v.string(),
    studentId: v.id("students"),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
  }).index("by_code", ["code"]),

  // Очередь сообщений родителю; бот забирает опросом и шлёт сам. Текст без цитат ребёнка.
  outbox: defineTable({
    parentId: v.id("parents"),
    chatId: v.string(),
    kind: v.union(v.literal("taught_bobr"), v.literal("crisis")),
    text: v.string(),
    createdAt: v.number(),
    sentAt: v.optional(v.number()),
    // только crisis-строки: точная защита от дубля (crisisDedupeKey)
    studentId: v.optional(v.id("students")),
    category: v.optional(guardCategory),
    urgent: v.optional(v.boolean()),
    dedupeKey: v.optional(v.string()),
  })
    .index("by_sent_and_created", ["sentAt", "createdAt"])
    .index("by_parent_and_dedupe_and_sent", ["parentId", "dedupeKey", "sentAt"]),

  // Сессии ребёнка (SPEC_SYSTEM §3–4): токен в localStorage устройства, идёт в каждую детскую функцию.
  // kind "parent" зарезервирован ТЗ; сессии Mini App пока живут в parentSessions.
  sessions: defineTable({
    token: v.string(),
    kind: v.union(v.literal("child"), v.literal("parent")),
    studentId: v.optional(v.id("students")),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),

  // Сессии Mini App (из parentLogin). 7 дней.
  parentSessions: defineTable({ parentId: v.id("parents"), token: v.string(), expiresAt: v.number() })
    .index("by_token", ["token"]),

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
