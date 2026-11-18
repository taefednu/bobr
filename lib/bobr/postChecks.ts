// Реплика Bobr проходит те же проверки, что и реплика Ustoz (postChecksUstoz); attempt задаёт код.
import { detectLeak } from "../fractions/leakDetector";
import { postChecksUstoz } from "../llm/postChecks";
import type { BobrTurn } from "../types";
import type { BobrPose } from "./scene";

export type BobrPostCtx = {
  attempt: string | null;
  expression: string; // выражение задачи сцены: его операнды в реплике не считаются утечкой
  numbersShown: string[];
  childNumbers: string[];
  forbiddenAnswer: string | null;
  recent: string[];
};
export type BobrLine = { reply: string; emotion: string; pose: BobrPose; attempt: string | null };
export type BobrPostResult = { ok: true; value: BobrLine } | { ok: false; reason: "empty" | "leak" | "numbers" | "repeat" };

const cut = (text: string, part: string) => (part ? text.split(part).join(" ") : text);
const digits = (s: string) => s.match(/\d+/g) ?? [];

/** Реплика без выражения и attempt: что осталось, не должно содержать ответ, ни целиком, ни по частям (3 и 5 при 3/5). */
function leaksAnswer(reply: string, answer: string, ctx: BobrPostCtx): boolean {
  // Bobr пишет LCM как НОК / EKUK (промпт), так что и эти формы — это выражение, а не утечка
  const exprs = [ctx.expression, ctx.expression.replace("LCM", "НОК"), ctx.expression.replace("LCM", "EKUK")];
  const rest = [...exprs, ctx.attempt ?? ""].reduce(cut, reply);
  if (detectLeak(rest, answer, ctx.childNumbers).leaked) return true;
  const fr = /^(\d+)\/(\d+)$/.exec(answer);
  if (!fr) return false;
  const seen = new Set(digits(rest));
  const child = new Set(ctx.childNumbers.flatMap(digits));
  return seen.has(fr[1]) && seen.has(fr[2]) && !(child.has(fr[1]) && child.has(fr[2]));
}

export function postChecksBobr(out: BobrTurn, ctx: BobrPostCtx): BobrPostResult {
  if (!out.reply.trim()) return { ok: false, reason: "empty" };
  if (ctx.forbiddenAnswer !== null && leaksAnswer(out.reply, ctx.forbiddenAnswer, ctx)) return { ok: false, reason: "leak" };
  const r = postChecksUstoz(
    { reply: out.reply, intent: "", component: null, hintLevel: 0, revealsAnswer: false },
    {
      answer: "", // утечку выше проверили сами; здесь только числа и повтор
      numbersShown: [...ctx.numbersShown, ...(ctx.attempt ? [ctx.attempt] : []), ...ctx.childNumbers],
      childNumbers: ctx.childNumbers,
      recent: ctx.recent,
    },
  );
  if (!r.ok) return { ok: false, reason: r.reason === "reveals_answer" ? "leak" : r.reason };
  return { ok: true, value: { reply: out.reply, emotion: out.emotion, pose: out.pose, attempt: ctx.attempt } };
}
