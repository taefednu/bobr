// Экран /home: баннер «следующая тема», круг «Научи», доля плана. Всё считает код (docs/design/v3/README.md).
import { v } from "convex/values";
import { graph } from "../lib/content";
import { pickTeach, planProgress as progressOf } from "../lib/home/progress";
import { query } from "./_generated/server";
import { GENERATED, houseTopicsOf, planProgress } from "./mahalla";
import { childOrNull } from "./session";

export const view = query({
  args: { token: v.string() },
  returns: v.union(v.null(), v.object({
    next: v.union(v.null(), v.object({ topic: v.string(), title: v.string(), percent: v.number() })),
    taught: v.number(),
    plan: v.object({ done: v.number(), total: v.number() }),
    teachTopic: v.union(v.string(), v.null()), // последняя solved_self в плане и стартуемая: круг «Научи» ведёт к ней, null — на /house
  })),
  handler: async (ctx, { token }) => {
    const child = await childOrNull(ctx, token);
    if (!child) return null;
    const { rows, order, level, next } = await planProgress(ctx, child._id);
    const { done, total, percent } = progressOf(order, (t) => level.get(t));
        return {
      next: next ? { topic: next, title: graph.topics.find((t) => t.id === next)?.title[child.lang] ?? next, percent } : null,
      taught: rows.filter((r) => r.level === "taught_bobr").length,
      plan: { done, total },
      teachTopic: pickTeach(rows, houseTopicsOf(order), (t) => GENERATED.has(t)),
    };
  },
});
