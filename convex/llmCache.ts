// Адаптер LlmCache для REPLAY (спека → «Сбои и демо»): internal, зовётся из actions через ctx.runQuery/runMutation.
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const get = internalQuery({
  args: { key: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { key }) => {
    const row = await ctx.db.query("llmCache").withIndex("by_key", (q) => q.eq("key", key)).first();
    return row?.response ?? null;
  },
});

export const put = internalMutation({
  args: { key: v.string(), step: v.string(), response: v.string() },
  returns: v.null(),
  handler: async (ctx, { key, step, response }) => {
    const row = await ctx.db.query("llmCache").withIndex("by_key", (q) => q.eq("key", key)).first();
    if (row) await ctx.db.patch("llmCache", row._id, { response });
    else await ctx.db.insert("llmCache", { key, step, response });
    return null;
  },
});
