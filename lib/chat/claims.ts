// Арифметика в тексте чата: код находит простые утверждения с дробями и целыми и считает их (fraction.js, без float).
// Ребёнок: true/false уходит в промпт (<code_check>), верное значение — никогда. Реплика Ustoz: ложное утверждение = сбой;
// нерешённое выражение ребёнка («3/4 * 2/5 = ?») — это «ответ» для detectLeak.
// ponytail: одно действие a op b [= c]; цепочки «a + b + c = d» не разбираем (и не выдаём по ним вердикт). Операнды — целое, дробь или смешанное число «1 1/2».
import Fraction from "fraction.js";
import { normalizeText } from "../text/normalize";

export type Claim = { text: string; ok: boolean; expr: string };
export type OpenExpr = { expr: string; value: string; operands: string[] };

// смешанное число идёт первым, иначе «1 1/2» разобралось бы как «1» и «1/2»
const F = "\\d{1,6}\\s\\d{1,6}/\\d{1,6}|\\d{1,6}(?:/\\d{1,6})?";
// «/» как деление — только отдельно стоящий (между пробелами), иначе это черта дроби
const OP = "[+*:\\-]|(?<=\\s)/(?=\\s)";
// операнд не начинается сразу после знака действия или после целого (тогда это хвост смешанного числа), результат не продолжается знаком
const START = "(?<![\\d/.,]|\\d\\s|[+*×÷\\-]\\s?)";
const END = "(?!\\s*[+*×÷\\-]\\s*\\d)";
const EXPR = new RegExp(`${START}(${F})\\s*(${OP})\\s*(${F})(?![\\d/])(?:\\s*=\\s*(-?(?:${F})|\\?))?(?![\\d/])${END}`, "gu");
const EQUIV = new RegExp(`${START}(${F})\\s*=\\s*(-?(?:${F}))(?![\\d/])${END}`, "gu");
const MAX_CLAIMS = 5;

// словесные и символьные знаки действия → один символ; «x»/«х»/«·» — умножение только между цифрами
const SYMBOLS: [RegExp, string][] = [
  [/(?<=\d)\s*[xXхХ·∙⋅×]\s*(?=\d)/gu, " * "],
  [/(?<![\p{L}])(?:плюс|прибавить|plyus|plus|qo'sh[\p{L}']*)(?![\p{L}])/giu, " + "],
  [/(?<![\p{L}])(?:минус|вычесть|minus|ayir[\p{L}']*)(?![\p{L}])/giu, " - "],
  [/(?<![\p{L}])(?:умножить на|умножь на|умноженное на|умножить|ko'paytir[\p{L}']*)(?![\p{L}])/giu, " * "],
  [/(?<![\p{L}])(?:разделить на|поделить на|разделить|поделить)(?![\p{L}])/giu, " : "],
  [/÷/gu, ":"],
];
// «1/2 прибавить 1/3 = 5/6»: слово-действие, которого мы не знаем, между операндами — вердикт по хвосту «1/3 = 5/6» не выдаём
const NOT_AN_OP = /(?:^|\s)(?:равно|равна|teng|будет|это|bu)\s*$/iu;
const AFTER_OPERAND_WORD = /\d\s+[\p{L}']{4,}(?:\s+\p{L}{1,3})?\s*$/u;

function frac(s: string): Fraction | null {
  // Текст ребёнка и модели: любой сбой разбора = «не утверждение», наружу не бросаем (1/00, гигантские числа).
  try {
    const neg = s.startsWith("-");
    const [whole, rest] = s.replace("-", "").split(" ");
    const [n, d] = (rest ?? whole).split("/");
    if (d !== undefined && BigInt(d) === 0n) return null;
    let f = d ? new Fraction(BigInt(n), BigInt(d)) : new Fraction(BigInt(n));
    if (rest !== undefined) f = f.add(new Fraction(BigInt(whole)));
    return neg ? f.neg() : f;
  } catch {
    return null;
  }
}

function calc(a: Fraction, op: string, b: Fraction): Fraction | null {
  try {
    if (op === "+") return a.add(b);
    if (op === "-") return a.sub(b);
    if (op === "*") return a.mul(b);
    if (b.n === 0n) return null;
    return a.div(b); // «:», «/»
  } catch {
    return null;
  }
}

const key = (s: string) => s.replace(/\s+/g, "");

export function scanMath(raw: string): { claims: Claim[]; open: OpenExpr[] } {
  let text = normalizeText(raw);
  for (const [re, to] of SYMBOLS) text = text.replace(re, to);
  text = text.replace(/\s+/g, " ");
  const claims: Claim[] = [];
  const open: OpenExpr[] = [];
  const spans: [number, number][] = [];
  for (const m of text.matchAll(EXPR)) {
    const [whole, a, op0, b, res] = m;
    const op = op0 === "/" ? ":" : op0;
    const hasFrac = a.includes("/") || b.includes("/");
    // «10-12 лет», «10:30» — не арифметика: целые без результата, и «:» без дроби, пропускаем; «12 + 7 = ?» — открытое выражение
    if (!hasFrac && !(res === "?" ? op === "+" || op === "*" : res && op !== ":")) continue;
    spans.push([m.index, m.index + whole.length]); // и «1/0 + 1/2 = 3/2» не должно дать ложную эквивалентность «1/2 = 3/2»
    const fa = frac(a);
    const fb = frac(b);
    const val = fa && fb ? calc(fa, op, fb) : null;
    if (!val) continue;
    const expr = `${a}${op}${b}`;
    if (!res || res === "?") {
      const operands = [a, b].flatMap((x) => (x.includes(" ") ? [x, ...x.split(" ")] : [x]));
      if (val.s >= 0n) open.push({ expr, value: val.toFraction(), operands });
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
    const before = rest.slice(0, m.index);
    if (AFTER_OPERAND_WORD.test(before) && !NOT_AN_OP.test(before.replace(/\s+\p{L}{1,3}\s*$/u, ""))) continue; // перед левой частью неопознанное действие
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
