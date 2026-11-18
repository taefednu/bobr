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
// «1 / 5 + 2/5» и «1/5+2/5» — одна запись: иначе выражение не вырежется и его числа сойдут за ответ по частям
const compact = (s: string) => s.replace(/\s*([/+=])\s*/g, "$1").replace(/\s*,\s*/g, ", ");
const digits = (s: string): string[] => s.match(/\d+/g) ?? [];

/** Реплика без выражения и attempt: что осталось, не должно содержать ответ, ни целиком, ни по частям (3 и 5 при 3/5). */
function leaksAnswer(reply: string, answer: string, ctx: BobrPostCtx): boolean {
  // Bobr пишет LCM как НОК / EKUK (промпт), так что и эти формы — это выражение, а не утечка
  const exprs = [ctx.expression, ctx.expression.replace("LCM", "НОК"), ctx.expression.replace("LCM", "EKUK")];
  const rest = [...exprs, ctx.attempt ?? ""].map(compact).reduce(cut, compact(reply));
  // Операнды, названные все и порознь («НОК чисел 12 и 6»), — не ответ, даже если один из них равен ему; лишнее вхождение ловится.
  const operands = digits(ctx.expression);
  const named = operands.length > 0 && operands.every((n) => digits(rest).includes(n));
  if (detectLeak(rest, answer, [...ctx.childNumbers, ...(named ? operands : [])]).leaked) return true;
  const fr = /^(\d+)\/(\d+)$/.exec(answer);
  if (!fr) return false;
  const seen = new Set(digits(rest));
  const child = new Set(ctx.childNumbers.flatMap(digits));
  return seen.has(fr[1]) && seen.has(fr[2]) && !(child.has(fr[1]) && child.has(fr[2]));
}

const fractionsIn = (s: string) => (s.match(/\d+\s*\/\s*\d+/g) ?? []).map((f) => f.replace(/\s+/g, ""));

/** Модель не задаёт числа: любая дробь реплики есть в выражении, attempt (код) или у ребёнка; на solved attempt обязан быть в реплике. */
function fractionsBad(reply: string, ctx: BobrPostCtx): boolean {
  const allowed = new Set([ctx.expression, ctx.attempt ?? "", ...ctx.childNumbers].flatMap(fractionsIn));
  if (fractionsIn(reply).some((f) => !allowed.has(f))) return true;
  const solved = ctx.forbiddenAnswer === null && ctx.attempt;
  if (!solved) return false;
  const tok = ctx.attempt!.replace(/\s+/g, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return !new RegExp(`(?<!\\d)${tok}(?!\\d)`).test(reply.replace(/\s+/g, ""));
}

export function postChecksBobr(out: BobrTurn, ctx: BobrPostCtx): BobrPostResult {
  if (!out.reply.trim()) return { ok: false, reason: "empty" };
  if (ctx.forbiddenAnswer !== null && leaksAnswer(out.reply, ctx.forbiddenAnswer, ctx)) return { ok: false, reason: "leak" };
  if (fractionsBad(out.reply, ctx)) return { ok: false, reason: "numbers" };
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
