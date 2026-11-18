// Private, reusable parent/teacher projection. Call only after checking access
// to the student; it never returns stored documents or child conversation text.
import { v } from "convex/values";
import { graph } from "../lib/content";
import { LESSON } from "../lib/config";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

const TASK_LIMIT = LESSON.maxTasksPerTopicPerSession;
const EVENT_LIMIT = 20;
const WEEK_TASK_LIMIT = 100;
type ProgressRow = {
  outcome: "active" | "independent" | "assisted";
  escalationLevel: number;
  misconceptionTag: string | null;
  createdAt: number;
};
type EventRow = {
  topicNodeId: string;
  escalationLevel: number;
  misconceptionTag: string | null;
  timestamp: number;
  reason: string;
};

export function projectLessonSupport<T extends ProgressRow, E extends EventRow>(
  topicNodeId: string,
  lesson: { startedAt: number; status?: "active" | "completed" } | null,
  tasks: readonly T[],
  events: readonly E[],
) {
  const complete = lesson !== null && tasks.length <= TASK_LIMIT;
  const ordered = [...tasks].sort((a, b) => a.createdAt - b.createdAt);
  const active = lesson?.status === "completed" ? undefined : ordered.findLast((task) => task.outcome === "active");
  let streak = 0;
  for (const task of ordered) {
    if (task.outcome === "independent") streak = Math.min(3, streak + 1);
    else if (task.outcome === "assisted" || task.escalationLevel > 1) streak = 0;
  }
  const recent = [...events].sort((a, b) => b.timestamp - a.timestamp).slice(0, EVENT_LIMIT);
  const latestTag = recent.find((event) => event.misconceptionTag !== null)?.misconceptionTag
    ?? [...ordered].reverse().find((task) => task.misconceptionTag !== null)?.misconceptionTag ?? null;
  return {
    topicNodeId,
    tracking: lesson ? "latest_lesson" as const : "untracked" as const,
    startedAt: lesson?.startedAt ?? null,
    currentEscalationLevel: active?.escalationLevel ?? null,
    maxEscalationLevel: lesson && tasks.length ? Math.max(...tasks.map((task) => task.escalationLevel)) : null,
    independentlySolved: complete ? tasks.filter((task) => task.outcome === "independent").length : null,
    assistedSolved: complete ? tasks.filter((task) => task.outcome === "assisted").length : null,
    independentStreak: complete ? streak : null,
    latestMisconceptionTag: lesson ? latestTag : null,
    summaryComplete: complete,
    eventsLimited: events.length > EVENT_LIMIT,
    events: recent.map((event) => ({
      topicNodeId: event.topicNodeId,
      escalationLevel: event.escalationLevel,
      misconceptionTag: event.misconceptionTag,
      timestamp: event.timestamp,
      reason: event.reason,
    })),
  };
}

const nullableNumber = v.union(v.number(), v.null());
const nullableTag = v.union(v.string(), v.null());
const eventV = v.object({
  topicNodeId: v.string(), escalationLevel: v.number(), misconceptionTag: nullableTag,
  timestamp: v.number(), reason: v.string(),
});
export const learningSupportValidator = v.object({
  scope: v.literal("latest_lesson_per_topic"),
  topics: v.array(v.object({
    topicNodeId: v.string(), tracking: v.union(v.literal("untracked"), v.literal("latest_lesson")),
    startedAt: nullableNumber, currentEscalationLevel: nullableNumber, maxEscalationLevel: nullableNumber,
    independentlySolved: nullableNumber, assistedSolved: nullableNumber, independentStreak: nullableNumber,
    latestMisconceptionTag: nullableTag, summaryComplete: v.boolean(),
  })),
  recentEvents: v.array(eventV),
  recentEventsLimited: v.boolean(),
});

export const weeklySupportValidator = v.union(v.null(), v.object({ independentlySolved: v.number(), assistedSolved: v.number() }));

export async function weeklySupportFor(ctx: QueryCtx, studentId: Id<"students">, since: number) {
  const tasks = await ctx.db.query("taskProgress").withIndex("by_student_and_finishedAt", (q) =>
    q.eq("studentId", studentId).gte("finishedAt", since)).take(WEEK_TASK_LIMIT + 1);
  if (!tasks.length || tasks.length > WEEK_TASK_LIMIT) return null;
  return {
    independentlySolved: tasks.filter((task) => task.outcome === "independent").length,
    assistedSolved: tasks.filter((task) => task.outcome === "assisted").length,
  };
}

/** Latest lesson per curriculum node, not lifetime or calendar-week totals. */
export async function learningSupportFor(ctx: QueryCtx, studentId: Id<"students">) {
  const topics = [];
  const events: EventRow[] = [];
  let limited = false;
  for (const topic of graph.topics) {
    const lesson = await ctx.db.query("lessonSessions")
      .withIndex("by_student_and_topicNodeId_and_startedAt", (q) => q.eq("studentId", studentId).eq("topicNodeId", topic.id))
      .order("desc").first();
    const tasks = lesson ? await ctx.db.query("taskProgress")
      .withIndex("by_lessonSessionId", (q) => q.eq("lessonSessionId", lesson._id)).take(TASK_LIMIT + 1) : [];
    const recent = lesson ? await ctx.db.query("escalationEvents")
      .withIndex("by_lessonSessionId_and_timestamp", (q) => q.eq("lessonSessionId", lesson._id))
      .order("desc").take(EVENT_LIMIT + 1) : [];
    const projected = projectLessonSupport(topic.id, lesson, tasks, recent);
    const { events: topicEvents, eventsLimited, ...summary } = projected;
    topics.push(summary);
    events.push(...topicEvents);
    limited ||= eventsLimited;
  }
  events.sort((a, b) => b.timestamp - a.timestamp);
  return {
    scope: "latest_lesson_per_topic" as const,
    topics,
    recentEvents: events.slice(0, EVENT_LIMIT),
    recentEventsLimited: limited || events.length > EVENT_LIMIT,
  };
}
