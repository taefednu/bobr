// Экран /house: уровни острова по плану (docs/design/v3/README.md, решение владельца 18.11: только кликабельные камни).
// Темы плана по порядку, затем следующие стартуемые темы графа, всего 6 (houseTopicsOf). Любой камень стартует через mahalla:startLesson.
import { v } from "convex/values";
import { graph } from "../lib/content";
import { houseLevels } from "../lib/home/progress";
import { query } from "./_generated/server";
import { houseTopicsOf, planProgress } from "./mahalla";
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
    const { level, order } = await planProgress(ctx, child._id);
    const topics = houseTopicsOf(order);
    const houses = await ctx.db.query("houses").withIndex("by_student_and_topic", (q) => q.eq("studentId", child._id)).take(20);
    const dimmed = new Set(houses.filter((h) => h.state === "dimmed").map((h) => h.topic as string));
    return {
      levels: houseLevels(topics, (t) => level.get(t), (t) => dimmed.has(t)).map((l) => ({
        ...l, title: graph.topics.find((t) => t.id === l.topic)?.title[child.lang] ?? l.topic,
      })),
    };
  },
});
