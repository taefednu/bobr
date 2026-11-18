// postChecks реплики Ustoz (решение этапа 2): leakDetector на реплике И на params компонента, числа —
// «нет чисел вне numbersShown ∪ числа ребёнка», repeatGuard, revealsAnswer. Сбой → запасной путь.
import { detectLeak } from "../fractions/leakDetector";
import { repeatGuard } from "../safety/repeatGuard";
import { normalizeForMatch, normalizeText } from "../text/normalize";
import type { UstozTurn } from "../types";

export type UstozPostFail = "leak" | "numbers" | "repeat" | "reveals_answer" | "mojibake";
export type UstozPostResult = { ok: true; value: UstozTurn } | { ok: false; reason: UstozPostFail };
export type UstozCtx = { answer: string; numbersShown: string[]; childNumbers: string[]; recent: string[] };

// Числа-слова (ru/uz) — numberCheck их не видит, а детектор утечки знает только дробные формы.
// Prompt требует цифры, так что слово-число, чьей цифровой формы нет среди разрешённых, — сбой.
// TODO(носитель): uz-числа 2–10 написаны агентом. «bir» нет в списке намеренно: артикль («bir xil») — не число.
const WORDS: Record<string, number> = {
  ноль: 0, один: 1, одна: 1, одно: 1, два: 2, две: 2, три: 3, четыре: 4, пять: 5, шесть: 6, семь: 7,
  восемь: 8, девять: 9, десять: 10, одиннадцать: 11, двенадцать: 12,
  nol: 0, ikki: 2, uch: 3, "to'rt": 4, besh: 5, olti: 6, yetti: 7, sakkiz: 8, "to'qqiz": 9,
  "o'n": 10,
};
const WORD_RE = new RegExp(`(?<![\\p{L}'])(${Object.keys(WORDS).join("|")})(?![\\p{L}'])`, "gu");

/** Множество, не мультимножество: любое число в тексте обязано быть среди разрешённых, повторы — сколько угодно. */
function numberOutside(text: string, allowed: Set<string>): boolean {
  return (normalizeText(text).match(/\d+(?:[.,]\d+)?/g) ?? []).some((n) => !allowed.has(n.replace(",", ".")));
}

function wordNumberExtra(text: string, allowed: Set<string>): boolean {
  for (const m of normalizeForMatch(text).matchAll(WORD_RE)) if (!allowed.has(String(WORDS[m[1]]))) return true;
  return false;
}

// UTF-8, прочитанный как Latin-1/CP1252 («â€”» вместо «—»): такую реплику ребёнку не показываем (живой прогон 18.11).
const MOJIBAKE = /â€|Ã[\u0080-\u00BF]|Ð[\u0080-\u00BF]/;

export function postChecksUstoz(out: UstozTurn, ctx: UstozCtx): UstozPostResult {
  if (out.revealsAnswer) return { ok: false, reason: "reveals_answer" };
  if (MOJIBAKE.test(out.reply)) return { ok: false, reason: "mojibake" };
  // Компонент: fractions — готовые строки "a/b"; ответ в них ловит тот же детектор, что и в реплике.
  const values = out.component?.fractions ?? [];
  const texts = [out.reply, ...values];
  for (const t of texts) if (detectLeak(t, ctx.answer, ctx.numbersShown).leaked) return { ok: false, reason: "leak" };

  const allowed = [...ctx.numbersShown, ...ctx.childNumbers];
  const allowedTokens = new Set(allowed.flatMap((n) => n.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(",", ".")));
  for (const t of texts) {
    if (numberOutside(t, allowedTokens) || wordNumberExtra(t, allowedTokens)) return { ok: false, reason: "numbers" };
  }
  if (repeatGuard(out.reply, ctx.recent).repeat) return { ok: false, reason: "repeat" };
  return { ok: true, value: out };
}

/** Ustoz упал → компонент (по операндам задачи, из кода) + кнопка «подсказка». */
export function fallbackUstoz(task: { numbersShown: string[] }) {
  const fr = task.numbersShown.filter((n) => /^\d+\/\d+$/.test(n));
  // TODO(spec): params pie не описаны; f1, f2… — значения-дроби операндов
  const params = (fr.length ? fr : task.numbersShown).map((value, i) => ({ key: `f${i + 1}`, value }));
  return { reply: null, component: { type: "pie" as const, params }, hintButton: true as const };
}

