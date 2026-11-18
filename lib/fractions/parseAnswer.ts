// parseAnswer: ввод ребёнка → каноническая дробь-строка. Спека → «Детерминированные модули».
// Только fraction.js, без float: десятичные идут в fraction.js строкой.
import Fraction from "fraction.js";
import { THRESHOLDS } from "../config";
import { normalizeForMatch } from "../text/normalize";
import type { Task } from "./task";

export type ParseResult =
  | { ok: true; value: string; reducible: boolean }
  | { ok: false; reason: "empty" | "div_by_zero" | "invalid" | "too_long" };

export type CheckResult = {
  status: "ok" | "almost" | "misconception" | "wrong" | "unparsed";
  value?: string;
  misconception?: string;
  /** Только при unparsed. */
  reason?: Extract<ParseResult, { ok: false }>["reason"];
};

// Только формы из спеки; «пол» и «yarim» целым словом (Unicode-границы: \b не знает кириллицу).
const HALF_WORD = /(^|[^\p{L}])(?:yarim|половина|пол)(?![\p{L}])/gu;
const WHITELIST = /^(?:(\d+)|(\d+)\/(\d+)|(\d+) (\d+)\/(\d+)|\d+\.\d+)$/;

const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? a : gcd(b, a % b));

export function parseFraction(raw: string): ParseResult {
  if (raw.length > THRESHOLDS.preGuardMaxInput) return { ok: false, reason: "too_long" };
  const t = normalizeForMatch(raw)
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(HALF_WORD, "$1 1/2")
    .replace(/(\d)\s*\+\s*(\d+\s*\/)/g, "$1 $2")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return { ok: false, reason: "empty" };
  const m = WHITELIST.exec(t);
  if (!m) return { ok: false, reason: "invalid" };

  const [, , n1, d1, whole, n2, d2] = m;
  const n = n1 ?? n2;
  const d = d1 ?? d2;
  if (d !== undefined && /^0+$/.test(d)) return { ok: false, reason: "div_by_zero" };

  // Несократимость — по сырым числителю/знаменателю, до fraction.js (он сокращает сам).
  const reducible = n !== undefined && d !== undefined && gcd(BigInt(n), BigInt(d)) > 1n;
  const f =
    whole !== undefined
      ? new Fraction(whole).add(new Fraction(`${n2}/${d2}`))
      : new Fraction(t);
  return { ok: true, value: f.toFraction(), reducible };
}

export function checkAnswer(
  raw: string,
  task: Pick<Task, "answer" | "distractors" | "requireReduced"> & Partial<Pick<Task, "kind" | "params">>,
): CheckResult {
  const p = parseFraction(raw);
  if (!p.ok) return { status: "unparsed", reason: p.reason };
  const val = new Fraction(p.value);
  // «найди пропущенное ?/toDen»: ввод — числитель, но полная дробь k/toDen (любая равная) тоже верна.
  const toDen = task.kind === "missing" && task.params?.toDen ? new Fraction(task.params.toDen) : null;
  const alt = toDen ? val.mul(toDen) : null; // числитель, если ребёнок ввёл всю дробь
  const is = (x: string) => val.equals(new Fraction(x)) || (alt !== null && alt.equals(new Fraction(x)));
  if (is(task.answer)) {
    if (toDen) return { status: "ok", value: p.value };
    return { status: p.reducible && task.requireReduced ? "almost" : "ok", value: p.value };
  }
  for (const dis of task.distractors) {
    if (!is(dis.value)) continue;
    return dis.misconception
      ? { status: "misconception", value: p.value, misconception: dis.misconception }
      : { status: "wrong", value: p.value };
  }
  return { status: "wrong", value: p.value };
}
