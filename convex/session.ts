// Детская сессия (SPEC_SYSTEM §3–4): токен из localStorage → ребёнок. Все детские функции этапа 3 берут ребёнка
// ТОЛЬКО через childOf(ctx, token) — studentId с клиента не принимаем (BLOCKERS B9, IDOR).
import { v } from "convex/values";
import { SESSION_DAYS } from "../lib/config";
import { randomString } from "../lib/telegram/secure";
import { env } from "./botAuth";
import type { Doc, Id } from "./_generated/dataModel";
import { internalQuery, mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

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

/** Переходный вход урока: token (как надо) или studentId (старый экран урока, IDOR — BLOCKERS B9; только при DEMO_ALLOW_ANON=1).
 *  TODO(B9): когда front перейдёт на token, убрать studentId из args turn / lesson:view / leaveCrisis и эту ветку. */
export const whoArgs = { token: v.optional(v.string()), studentId: v.optional(v.id("students")) };
export async function studentIdOf(ctx: QueryCtx, who: { token?: string; studentId?: Id<"students"> }): Promise<Id<"students"> | null> {
  if (who.token !== undefined) return (await childOrNull(ctx, who.token))?._id ?? null;
  // старый вход по studentId жив только на демо-стенде (DEMO_ALLOW_ANON=1); без флага — закрыт
  return env("DEMO_ALLOW_ANON") === "1" ? (who.studentId ?? null) : null;
}

/** Для action (turn): тот же разбор через runQuery. */
export const resolve = internalQuery({
  args: whoArgs,
  returns: v.union(v.null(), v.id("students")),
  handler: (ctx, who) => studentIdOf(ctx, who),
});

export async function createChildSession(ctx: MutationCtx, studentId: Id<"students">): Promise<string> {
  const token = randomString(TOKEN_ALPHABET, 48);
  await ctx.db.insert("sessions", { token, kind: "child", studentId, expiresAt: Date.now() + SESSION_DAYS * 86_400_000 });
  return token;
}

/** Демо-вход без бота: новый ребёнок + сессия. Закрыт, пока в env Convex нет DEMO_ALLOW_ANON=1 (fail closed):
 *  иначе любой создаёт учеников в обход привязки. Согласие не ставится — его даёт экран раскрытия ИИ (acceptConsent). */
export const startDemo = mutation({
  args: { lang },
  returns: v.object({ token: v.string() }),
  handler: async (ctx, { lang }) => {
    if (env("DEMO_ALLOW_ANON") !== "1") throw new Error("unauthorized");
    const studentId = await ctx.db.insert("students", { lang, consent: false, state: "ONBOARD_CONSENT", riskCount: 0 });
    return { token: await createChildSession(ctx, studentId) };
  },
});

/** Экран раскрытия ИИ пройден: ONBOARD_CONSENT → GOAL_SETUP. В другом стейте — без изменений. */
export const acceptConsent = mutation({
  args: { token: v.string() },
  returns: v.null(),
  handler: async (ctx, { token }) => {
    const s = await childOf(ctx, token);
    if (s.state === "ONBOARD_CONSENT") await ctx.db.patch("students", s._id, { consent: true, state: "GOAL_SETUP" });
    return null;
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
