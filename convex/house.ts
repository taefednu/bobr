// Экран /house: уровни острова по плану (docs/design/v3/README.md, решение владельца 18.11: только кликабельные камни).
// В ответе лишь темы, которые стартуют через mahalla:startLesson (в плане и в GENERATED), поэтому level 1 открывает настоящий урок.
import { v } from "convex/values";
import { graph } from "../lib/content";
import { houseLevels } from "../lib/home/progress";
import { query } from "./_generated/server";
import { GENERATED, planProgress } from "./mahalla";
import { childOrNull } from "./session";

export const view = query({
  args: { token: v.string() },
  returns: v.union(v.null(), v.object({
    levels: v.array(v.object({
      n: v.number(), topic: v.string(), title: v.string(),
      state: v.union(v.literal("done"), v.literal("current"), v.literal("next"), v.literal("review")),
      canStart: v.boolean(),
    })),
  })),
  handler: async (ctx, { token }) => {
    const child = await childOrNull(ctx, token);
    if (!child) return null;
    const { order, level, next } = await planProgress(ctx, child._id);
    const houses = await ctx.db.query("houses").withIndex("by_student_and_topic", (q) => q.eq("studentId", child._id)).take(20);
    const dimmed = new Set(houses.filter((h) => h.state === "dimmed").map((h) => h.topic as string));
    return {
      levels: houseLevels(order, (t) => level.get(t), next, (t) => dimmed.has(t), (t) => GENERATED.has(t)).map((l) => ({
        ...l, title: graph.topics.find((t) => t.id === l.topic)?.title[child.lang] ?? l.topic,
      })),
    };
  },
});
