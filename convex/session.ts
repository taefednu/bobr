// Детская сессия (SPEC_SYSTEM §3–4): токен из localStorage → ребёнок. Все детские функции этапа 3 берут ребёнка
// ТОЛЬКО через childOf(ctx, token) — studentId с клиента не принимаем (BLOCKERS B9, IDOR).
import { v } from "convex/values";
import { SESSION_DAYS } from "../lib/config";
import { randomString } from "../lib/telegram/secure";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

const TOKEN_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const lang = v.union(v.literal("uz"), v.literal("ru"));

/** Ребёнок по токену или null (нет сессии, истекла, ребёнок удалён). Для query: null → экран «введи код». */
// ponytail: Date.now() в query — срок сессии; подписка пересчитается при следующем изменении данных.
export async function childOrNull(ctx: QueryCtx, token: string): Promise<Doc<"students"> | null> {
  const s = await ctx.db.query("sessions").withIndex("by_token", (q) => q.eq("token", token)).unique();
  if (!s || s.kind !== "child" || !s.studentId || s.expiresAt < Date.now()) return null;
  return await ctx.db.get("students", s.studentId);
}

/** То же для mutation: без сессии бросает "unauthorized". */
export async function childOf(ctx: QueryCtx, token: string): Promise<Doc<"students">> {
  const child = await childOrNull(ctx, token);
  if (!child) throw new Error("unauthorized");
  return child;
}

export async function createChildSession(ctx: MutationCtx, studentId: Id<"students">): Promise<string> {
  const token = randomString(TOKEN_ALPHABET, 48);
  await ctx.db.insert("sessions", { token, kind: "child", studentId, expiresAt: Date.now() + SESSION_DAYS * 86_400_000 });
  return token;
}

/** Демо-вход без бота: новый ребёнок в GOAL_SETUP + сессия. TODO(B9): до выкладки наружу закрыть (вход только через
 *  claimLinkCode) — сейчас любой может создать ученика; согласие ставится без экрана, как в startDemoLesson. */
export const startDemo = mutation({
  args: { lang },
  returns: v.object({ token: v.string() }),
  handler: async (ctx, { lang }) => {
    const studentId = await ctx.db.insert("students", { lang, consent: true, state: "GOAL_SETUP", riskCount: 0 });
    return { token: await createChildSession(ctx, studentId) };
  },
});

/** Кто я и на каком экране: по state front решает маршрут. studentId — пока урок (turn, lesson:view) не переведён на токен. */
export const me = query({
  args: { token: v.string() },
  returns: v.union(v.null(), v.object({
    studentId: v.id("students"), lang, state: v.string(),
    goal: v.union(v.null(), v.literal("test_soon"), v.literal("improve"), v.literal("just_practice")),
    testDate: v.union(v.null(), v.string()),
  })),
  handler: async (ctx, { token }) => {
    const s = await childOrNull(ctx, token);
    return s && { studentId: s._id, lang: s.lang, state: s.state, goal: s.goal ?? null, testDate: s.testDate ?? null };
  },
});
