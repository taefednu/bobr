// Генератор задач: детерминированный (seed → тот же Task). Спека → «Детерминированные модули».
// Числа, ответы и дистракторы считает только код; текст задачи собирает UI по kind и params.
import Fraction from "fraction.js";
import type { TopicId } from "../types";
import type { Distractor, Task, TaskKind } from "./task";

export type GenKind = Exclude<TaskKind, "mcq">;

// Kind↔topic: picture/word — одна формула числа на тему, ответ — дробь (N5: числитель над toDen).
// missing (N2/N5/N8/N9): ответ — числитель над params.toDen, requireReduced false; N6 — целое, toDen нет.
// N3 — та же формула, что N2 (точка на прямой вместо закрашенной части). N4 — какая единичная дробь больше (ответ 1/min;
// missing: знаменатель большей дроби, целое, toDen нет).
// TODO: N1, N7, N10 — генератор не написан.

/** mulberry32: 32-битный seeded PRNG, [0, 1). */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;
const f = (n: number, d = 1) => new Fraction(n, d);

type Cand = { v: Fraction; m?: string };
type Built = Pick<Task, "params" | "answer" | "distractors" | "requireReduced" | "numbersShown">;

/** Первые 3 различных (по значению) кандидата, не равных ответу. */
function distract(answer: Fraction, cands: Cand[]): Distractor[] {
  const seen = [answer];
  const out: Distractor[] = [];
  for (const { v, m } of cands) {
    if (v.s <= 0n || v.n === 0n || seen.some((x) => x.equals(v))) continue; // только положительные
    seen.push(v);
    out.push(m ? { value: v.toFraction(), misconception: m } : { value: v.toFraction() });
    if (out.length === 3) break;
  }
  return out;
}

const s = (...xs: number[]) => xs.map(String);

// ── по темам: числа → Built ──

// «missing»: ребёнок вводит числитель над показанным знаменателем params.toDen; answer и дистракторы — числители.
function partOfWhole(k: number, n: number, missing: boolean): Built {
  const ans = f(k, n);
  if (missing)
    return {
      params: { num: String(k), den: String(n), toDen: String(n) },
      answer: String(k),
      distractors: distract(f(k), [{ v: f(n - k) }, { v: f(k + 1) }, { v: f(k - 1) }, { v: f(n) }, { v: f(k + 2) }]),
      requireReduced: false,
      numbersShown: s(k, n, n),
    };
  return {
    params: { num: String(k), den: String(n) },
    answer: ans.toFraction(),
    distractors: distract(ans, [
      { v: f(n - k, n) }, // «неокрашенная часть»
      { v: f(k, n - k) }, // часть к части
      { v: f(k + 1, n) },
      { v: f(k, n + 1) },
    ]),
    requireReduced: true,
    numbersShown: s(k, n),
  };
}

function equivalent(a: number, b: number, d: number): Built {
  const ans = f((a * d) / b); // «a/b = ?/d»
  return {
    params: { num: String(a), den: String(b), toDen: String(d) },
    answer: ans.toFraction(),
    distractors: distract(ans, [
      { v: f(a + d - b) }, // прибавил к числителю то же, что к знаменателю
      { v: f(a) },
      { v: ans.add(1) },
      { v: ans.sub(1) },
      { v: f(d) },
    ]),
    requireReduced: false, // ответ — целое
    numbersShown: s(a, b, d),
  };
}

function lcmTask(a: number, b: number): Built {
  const ans = f(lcm(a, b));
  return {
    params: { a: String(a), b: String(b) },
    answer: ans.toFraction(),
    distractors: distract(ans, [
      { v: f(a * b) },
      { v: f(a + b) },
      { v: f(gcd(a, b)) },
      { v: ans.add(a) },
      { v: f(Math.max(a, b)) },
    ]),
    requireReduced: false,
    numbersShown: s(a, b),
  };
}

function addSame(a: number, c: number, d: number, missing: boolean): Built {
  const ans = f(a + c, d);
  if (missing) // M9 тут не выразим числителем над d (знаменатель 2d ≠ d) — не включаем
    return {
      params: { a: String(a), c: String(c), den: String(d), toDen: String(d) },
      answer: String(a + c),
      distractors: distract(f(a + c), [{ v: f(a * c) }, { v: f(a + c + 1) }, { v: f(a + c - 1) }, { v: f(d) }]),
      requireReduced: false,
      numbersShown: s(a, d, c, d, d),
    };
  return {
    params: { a: String(a), c: String(c), den: String(d) },
    answer: ans.toFraction(),
    distractors: distract(ans, [
      { v: f(a + c, 2 * d), m: "M9" }, // (a+c)/(d+d)
      { v: f(a + c, d + 1) },
      { v: f(a * c, d) },
      { v: f(a + c + 1, d) },
    ]),
    requireReduced: true,
    numbersShown: s(a, d, c, d),
  };
}

function addDiff(a: number, b: number, c: number, d: number, missing: boolean): Built {
  const ans = f(a, b).add(f(c, d));
  const params = { a: String(a), b: String(b), c: String(c), d: String(d) };
  if (missing) {
    const L = lcm(b, d); // «a/b + c/d = ?/L»
    const num = (a * L) / b + (c * L) / d;
    return {
      params: { ...params, toDen: String(L) },
      answer: String(num),
      distractors: distract(f(num), [
        // M9 (a+c)/(b+d) выражается числителем только при b+d = L; иначе отбрасываем
        ...(b + d === L ? [{ v: f(a + c), m: "M9" }] : []),
        { v: f(a + c) }, // «сложил числители»
        { v: f(a * c) },
        { v: f(num + 1) },
        { v: f(num - 1) },
        { v: f(L) },
      ]),
      requireReduced: false,
      numbersShown: s(a, b, c, d, L),
    };
  }
  return {
    params,
    answer: ans.toFraction(),
    distractors: distract(ans, [
      { v: f(a + c, b + d), m: "M9" },
      { v: f(a + c, lcm(b, d)) }, // сложил числители, взял НОК
      { v: f(a + c, Math.max(b, d)) },
      { v: f(a * c, b * d) },
    ]),
    requireReduced: true,
    numbersShown: s(a, b, c, d),
  };
}

function compareUnit(p: number, q: number, missing: boolean): Built {
  const lo = Math.min(p, q), hi = Math.max(p, q); // больше та, у которой знаменатель меньше
  const params = { p: String(p), q: String(q) };
  if (missing)
    return {
      params, answer: String(lo),
      distractors: distract(f(lo), [{ v: f(hi) }, { v: f(p + q) }, { v: f(lo + 1) }, { v: f(hi + 1) }]),
      requireReduced: false, numbersShown: s(1, p, 1, q),
    };
  const ans = f(1, lo);
  return {
    params, answer: ans.toFraction(),
    distractors: distract(ans, [{ v: f(1, hi) }, { v: f(1, p + q) }, { v: f(1, hi + 1) }, { v: f(2, lo) }]), // «знаменатель больше — дробь больше»
    requireReduced: true, numbersShown: s(1, p, 1, q),
  };
}

const int = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
const coprimeIn = (r: () => number, lo: number, hi: number, n: number) => {
  const xs = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter((x) => gcd(x, n) === 1);
  return xs[int(r, 0, xs.length - 1)];
};

const partTask = (r: () => number, m: boolean) => {
  const n = int(r, 2, 12);
  return partOfWhole(coprimeIn(r, 1, n - 1, n), n, m); // k/n уже несократима
};

const BUILDERS: Partial<Record<TopicId, (r: () => number, missing: boolean) => Built>> = {
  N2: partTask,
  N3: partTask,
  N4: (r, m) => {
    const p = int(r, 2, 12);
    let q = int(r, 2, 11);
    if (q >= p) q++; // p ≠ q
    return compareUnit(p, q, m);
  },
  N5: (r) => {
    const b = int(r, 2, 6);
    const d = b * int(r, 2, Math.floor(12 / b));
    return equivalent(coprimeIn(r, 1, b - 1, b), b, d);
  },
  N6: (r) => {
    const a = int(r, 2, 12);
    let b = int(r, 2, 11);
    if (b >= a) b++; // a ≠ b
    return lcmTask(a, b);
  },
  N8: (r, m) => {
    const d = int(r, 3, 12);
    const a = int(r, 1, d - 2);
    return addSame(a, int(r, 1, d - 1 - a), d, m); // сумма < 1
  },
  N9: (r, m) => {
    const b = int(r, 2, 12);
    let d = int(r, 2, 11);
    if (d >= b) d++; // b ≠ d
    return addDiff(int(r, 1, b - 1), b, int(r, 1, d - 1), d, m);
  },
};

export function generateTask(topic: TopicId, kind: GenKind, seed: number): Task {
  const build = BUILDERS[topic];
  if (!build) throw new Error(`generator: topic ${topic} not supported yet`);
  return { id: `${topic}-${kind}-${seed}`, topic, kind, seed, ...build(mulberry32(seed), kind === "missing") };
}

/** Диагностическая версия задачи: kind "mcq" (варианты — mcqOptions). */
export const toMcq = (t: Task): Task => ({ ...t, kind: "mcq", id: `${t.id}-mcq` });

/** Варианты MCQ: ответ + дистракторы, порядок детерминирован seed'ом. */
export function mcqOptions(t: Task): string[] {
  const r = mulberry32(t.seed ^ 0x9e3779b9);
  const xs = [t.answer, ...t.distractors.map((d) => d.value)];
  for (let i = xs.length - 1; i > 0; i--) {
    const j = int(r, 0, i);
    [xs[i], xs[j]] = [xs[j], xs[i]];
  }
  return xs;
}

const probe = (topic: TopicId, b: Built): Task => ({ id: `probe-${topic}`, topic, kind: "mcq", seed: 0, ...b });

/** Фиксированные пробы демо в порядке DEMO_PROBE_ORDER (спека: N9 → N8 → N2 → N5 → N6 → N1). */
export const DEMO_PROBES: Task[] = [
  probe("N9", addDiff(1, 2, 1, 3, false)), // 5/6, M9 → 2/5
  probe("N8", addSame(1, 2, 5, false)), // 3/5, M9 → 3/10
  // TODO(content): спека не задаёт пробу N2 — число из фиксированного seed
  toMcq(generateTask("N2", "picture", 1)),
  probe("N5", equivalent(1, 2, 6)), // 3
  probe("N6", lcmTask(2, 3)), // 6
  // TODO(content): проба N1 (равные доли) — N1 не тема генератора, спека чисел не даёт; пропущена.
];
