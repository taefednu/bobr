// postChecks реплики болталки. Чисел и вердиктов тут нет, но при активной задаче ответ не должен утечь в разговоре.
import { detectLeak } from "../fractions/leakDetector";
import { repeatGuard } from "../safety/repeatGuard";
import { normalizeText } from "../text/normalize";
import { scanMath } from "./claims";
import type { ChatTurn } from "../types";

export type ChatPostFail = "empty" | "mojibake" | "leak" | "numbers" | "repeat" | "lang" | "claim";
export type ChatPostResult = { ok: true; value: ChatTurn } | { ok: false; reason: ChatPostFail };
type Answer = { answer: string; numbersShown: string[] };
// task — текущая задача урока (если есть): её ответ и показанные числа. childNumbers — числа из текста ребёнка.
// open — нерешённые выражения ребёнка (openAnswers): их значение для Ustoz тот же «ответ». who "ustoz": можно использовать свои числа
// в примерах, зато ложное арифметическое утверждение в реплике = сбой. Без who — правила Bobr как были.
export type ChatCtx = { lang: "uz" | "ru"; task: Answer | null; childNumbers: string[]; recent: string[]; who?: "ustoz" | "bobr"; open?: Answer[];
  // утверждения ребёнка из scanMath (код посчитал): при любом ok:false реплика модели не проходит (любой собеседник)
  childClaims?: { ok: boolean }[] };

// UTF-8, прочитанный как Latin-1/CP1252: такую реплику ребёнку не показываем (как в postChecksUstoz).
const MOJIBAKE = /â€|Ã[\u0080-¿]|Ð[\u0080-¿]/;
const URL_LIKE = /https?:|www\.|\w\.(com|ru|uz|org|net)\b/i;

const CYRILLIC = /[\u0400-\u04FF]/;
const APOS = "['’‘`´ʹʻʼ]";
/** uz: oʻ/gʻ → U+02BB, остальные апострофы внутри слова → U+02BC. Одна функция для всех реплик модели. */
export const uzApostrophes = (s: string): string =>
  s.replace(new RegExp(`(\\p{L})${APOS}(?=\\p{L})`, "gu"), (_, a: string) => a + (/[oOgG]/.test(a) ? "\u02BB" : "\u02BC"));

export function postChecksChat(out: ChatTurn, ctx: ChatCtx): ChatPostResult {
  const reply = out.reply.trim();
  if (!reply) return { ok: false, reason: "empty" };
  if (MOJIBAKE.test(reply) || URL_LIKE.test(reply)) return { ok: false, reason: "mojibake" };
  // язык и письмо: uz без кириллицы, ru с кириллицей (иначе ребёнок читает реплику не на своём языке)
  if (ctx.lang === "uz" ? CYRILLIC.test(reply) : !CYRILLIC.test(reply)) return { ok: false, reason: "lang" };
  if (ctx.task) {
    if (detectLeak(reply, ctx.task.answer, ctx.task.numbersShown).leaked) return { ok: false, reason: "leak" };
    // numberCheck-стиль для Bobr: пока идёт задача, любое число вне numbersShown и текста ребёнка — сбой (модель может «посчитать»)
    if (ctx.who !== "ustoz") {
      const allowed = new Set([...ctx.task.numbersShown, ...ctx.childNumbers].flatMap((n) => n.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(",", ".")));
      if ((normalizeText(reply).match(/\d+(?:[.,]\d+)?/g) ?? []).some((n) => !allowed.has(n.replace(",", ".")))) return { ok: false, reason: "numbers" };
    }
  }
  for (const o of ctx.open ?? []) if (detectLeak(reply, o.answer, o.numbersShown).leaked) return { ok: false, reason: "leak" };
  if (ctx.who === "ustoz" && scanMath(reply).claims.some((c) => !c.ok)) return { ok: false, reason: "claim" };
  // ребёнок написал неверное равенство: словарь похвалы не поймает «Да, ты прав!», поэтому ни одна реплика модели не проходит (отвечает код: fallback «recheck»)
  if (ctx.childClaims?.some((c) => !c.ok)) return { ok: false, reason: "claim" };
  if (repeatGuard(reply, ctx.recent).repeat) return { ok: false, reason: "repeat" };
  return { ok: true, value: { ...out, reply: ctx.lang === "uz" ? uzApostrophes(reply) : reply } };
}
