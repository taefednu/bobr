// Арифметика в тексте чата: код находит простые утверждения с дробями и целыми и считает их (fraction.js, без float).
// Ребёнок: true/false уходит в промпт (<code_check>), верное значение — никогда. Реплика Ustoz: ложное утверждение = сбой;
// нерешённое выражение ребёнка («3/4 * 2/5 = ?») — это «ответ» для detectLeak.
// ponytail: одно действие a op b [= c]; цепочки «a + b + c = d» ловят только первую пару, смешанные числа «1 1/2» не разбираются.
import Fraction from "fraction.js";
import { normalizeText } from "../text/normalize";

export type Claim = { text: string; ok: boolean; expr: string };
export type OpenExpr = { expr: string; value: string; operands: string[] };

const F = "\\d{1,6}(?:/\\d{1,6})?";
// «/» как деление — только отдельно стоящий (между пробелами), иначе это черта дроби
const OP = "[+*×÷:\\-]|(?<=\\s)/(?=\\s)";
// операнд не начинается сразу после знака действия и результат не продолжается знаком: цепочки «a + b + c = d» не режем на куски
const START = "(?<![\\d/.,]|[+*×÷\\-]\\s?)";
const END = "(?!\\s*[+*×÷\\-]\\s*\\d)";
const EXPR = new RegExp(`${START}(${F})\\s*(${OP})\\s*(${F})(?![\\d/])(?:\\s*=\\s*(-?${F}|\\?))?(?![\\d/])${END}`, "gu");
const EQUIV = new RegExp(`${START}(${F})\\s*=\\s*(${F})(?![\\d/])${END}`, "gu");
const MAX_CLAIMS = 5;

function frac(s: string): Fraction | null {
  const [n, d] = s.replace("-", "").split("/");
  if (d === "0") return null;
  const f = d ? new Fraction(BigInt(n), BigInt(d)) : new Fraction(BigInt(n));
  return s.startsWith("-") ? f.neg() : f;
}

function calc(a: Fraction, op: string, b: Fraction): Fraction | null {
  try {
    if (op === "+") return a.add(b);
    if (op === "-") return a.sub(b);
    if (op === "*" || op === "×") return a.mul(b);
    if (b.n === 0n) return null;
    return a.div(b); // «:», «÷», «/»
  } catch {
    return null;
  }
}

const key = (s: string) => s.replace(/\s+/g, "");

export function scanMath(raw: string): { claims: Claim[]; open: OpenExpr[] } {
  const text = normalizeText(raw);
  const claims: Claim[] = [];
  const open: OpenExpr[] = [];
  const spans: [number, number][] = [];
  for (const m of text.matchAll(EXPR)) {
    const [whole, a, op, b, res] = m;
    const hasFrac = a.includes("/") || b.includes("/");
    // «10-12 лет», «10:30» — не арифметика: целые без результата, и «:» без дроби, пропускаем
    if (!hasFrac && (!res || res === "?" || op === ":" || op === "/")) continue;
    if (op === ":" && !hasFrac) continue;
    spans.push([m.index, m.index + whole.length]); // и «1/0 + 1/2 = 3/2» не должно дать ложную эквивалентность «1/2 = 3/2»
    const fa = frac(a);
    const fb = frac(b);
    const val = fa && fb ? calc(fa, op, fb) : null;
    if (!val) continue;
    const expr = `${a}${op}${b}`;
    if (!res || res === "?") {
      if (val.s >= 0n) open.push({ expr, value: val.toFraction(), operands: [a, b] });
    } else {
      const fr = frac(res);
      if (fr && claims.length < MAX_CLAIMS) claims.push({ text: whole.replace(/\s+/g, " "), ok: val.equals(fr), expr });
    }
  }
  // эквивалентность «1/2 = 3/6» — по тексту без уже разобранных выражений
  let rest = text;
  for (const [s, e] of spans) rest = rest.slice(0, s) + " ".repeat(e - s) + rest.slice(e);
  for (const m of rest.matchAll(EQUIV)) {
    if (!m[1].includes("/") && !m[2].includes("/")) continue;
    const l = frac(m[1]);
    const r = frac(m[2]);
    if (l && r && claims.length < MAX_CLAIMS) claims.push({ text: m[0], ok: l.equals(r), expr: key(m[0]) });
  }
  return { claims, open };
}

/** Ответы на нерешённые выражения из сообщений ребёнка; выражение, которое ребёнок потом сам записал верно, ответом не считаем. */
export function openAnswers(childTexts: string[]): { answer: string; numbersShown: string[] }[] {
  const scans = childTexts.map(scanMath);
  const solved = new Set(scans.flatMap((s) => s.claims.filter((c) => c.ok).map((c) => c.expr)));
  return scans.flatMap((s) => s.open).filter((o) => !solved.has(o.expr)).map((o) => ({ answer: o.value, numbersShown: o.operands }));
}
