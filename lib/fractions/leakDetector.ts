// leakDetector: ловит верный ответ задачи в реплике Ustoz/Bobr в любой форме (спека → «Детерминированные
// модули», «не режем никогда»). Всё сравнение — fraction.js, без float. Текст нормализуется
// normalizeForMatch (апострофы, NFKC, ½→1/2, регистр, ё→е).
//
// ОПЕРАНДЫ (numbersShown, необязательный третий аргумент): цифровые формы ответа — голая цифра целого
// ответа и точная дробь n/d — игнорируются только в пределах числа таких же чисел среди операндов
// («НОК чисел 4 и 2» при ответе 4 — не утечка; «НОК 4 и 2 — это 4» — утечка, лишняя 4). Слова,
// эквиваленты (k>1), десятичные и смешанные ловятся ВСЕГДА. Без numbersShown цифровая 6 при ответе "6"
// считается утечкой везде, так что вызывать надо только на репликах Ustoz/Bobr.
// Словесные формы целых — только ru и только 0–20 в именительном падеже; склонения и uz-числа не покрыты.
import Fraction from "fraction.js";
import { normalizeForMatch } from "../text/normalize";

export type LeakForm = "fraction" | "equivalent" | "decimal" | "mixed" | "word_ru" | "word_uz";
export type LeakResult = { leaked: boolean; match?: string; form?: LeakForm };

const MAX_K = 10;
const L = "[\\p{L}]";
const hit = (match: string, form: LeakForm): LeakResult => ({ leaked: true, match, form });

function parseAnswer(answer: string): Fraction | null {
  const m = /^\s*(?:(\d+)\s+)?(\d+)(?:\s*\/\s*(\d+))?\s*$/.exec(answer);
  if (!m) return null;
  const [, whole, a, b] = m;
  if (b === "0") return null;
  const frac = b ? new Fraction(BigInt(a), BigInt(b)) : new Fraction(BigInt(a));
  return whole ? frac.add(new Fraction(BigInt(whole))) : frac;
}

// ---- русские слова ----
const NUM_RU: Record<number, string[]> = {
  1: ["одна", "один", "одно", "одну", "одной", "одного"], 2: ["две", "два", "двух", "двум"],
  3: ["три", "трех", "трем"], 4: ["четыре", "четырех", "четырем"], 5: ["пять", "пяти"],
  6: ["шесть", "шести"], 7: ["семь", "семи"], 8: ["восемь", "восьми"], 9: ["девять", "девяти"],
  10: ["десять", "десяти"], 11: ["одиннадцать", "одиннадцати"], 12: ["двенадцать", "двенадцати"],
};
const MAX_NUM = 12;
const INT_RU = [
  "ноль", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять", "десять",
  "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать",
  "семнадцать", "восемнадцать", "девятнадцать", "двадцать",
];
const INT_RU_FEM: Record<number, string> = { 1: "одна", 2: "две" };
const ORD_STEM: Record<number, string> = {
  2: "втор", 4: "четверт", 5: "пят", 6: "шест", 7: "седьм", 8: "восьм", 9: "девят", 10: "десят",
  11: "одиннадцат", 12: "двенадцат",
};
const ORD_ENDINGS = ["ая", "ой", "ую", "ых", "ые"];
/** Все падежные формы знаменателя (ё уже заменена на е). */
function denomForms(d: number): string[] {
  if (d === 3) return ["треть", "трети", "третья", "третьей", "третью", "третьих", "третьи"];
  const forms = ORD_ENDINGS.map((e) => ORD_STEM[d] + e);
  if (d === 2) forms.push("половина", "половины", "половину");
  if (d === 4) forms.push("четверть", "четверти");
  return forms;
}
/** Слово-доля без числителя: «половина», «треть», «четверть» (= 1/d). */
const ALONE: Record<number, string[]> = {
  2: ["половина", "половину", "половины", "половинка"],
  3: ["треть", "трети"],
  4: ["четверть", "четверти"],
};
const alt = (xs: string[]) => `(?:${xs.join("|")})`;
const NUM_ANY = alt(Object.values(NUM_RU).flat());

/** «1 целая 1/6», «одна целая одна шестая» для неправильной дроби whole + fn/fd. */
function mixedWordsRu(text: string, whole: number, fn: number, fd: number): string | null {
  if (fn > MAX_NUM || fd > 12 || fd < 2) return null;
  const wholes = [String(whole), ...(whole <= 20 ? [INT_RU[whole], INT_RU_FEM[whole]].filter(Boolean) : [])];
  const frac = alt([`${fn} ?/ ?${fd}`, `${alt(NUM_RU[fn])}\\s${alt(denomForms(fd))}`]);
  const re = new RegExp(
    `(?<![\\d/.,\\p{L}])${alt(wholes)}\\s${alt(["целая", "целых", "целую", "целое", "целой"])}\\s(?:и\\s)?${frac}(?![\\d/\\p{L}])`,
    "u",
  );
  return re.exec(text)?.[0] ?? null;
}

function wordsRu(text: string, n: number, d: number): string | null {
  // эквиваленты словами тоже: «десять двенадцатых» = 5/6, пока k·n ≤ 12 и k·d ≤ 12
  for (let k = 1; k <= MAX_K; k++) {
    const nn = n * k;
    const dd = d * k;
    if (nn > MAX_NUM || dd > 12 || dd < 2) continue;
    const re = new RegExp(`(?<!${L})${alt(NUM_RU[nn])}\\s${alt(denomForms(dd))}(?!${L})`, "u");
    const m = re.exec(text);
    if (m) return m[0];
  }
  if (n === 1 && ALONE[d]) {
    // не после числителя: «три четверти» — это 3/4, а не 1/4
    const re = new RegExp(`(?<!${L})(?<!${NUM_ANY}\\s)${alt(ALONE[d])}(?!${L})`, "u");
    const m = re.exec(text);
    if (m) return m[0];
  }
  return null;
}

// ---- узбекский ----
// Только формы из спеки: 2/3 «uchdan ikki» (знаменатель первым), 1/2 «yarim», 1/4 «chorak».
// TODO(носитель): остальные uz-формы («beshdan uch»…) после словаря от носителя
// TODO(носитель): вычитать аффиксные формы (притяжательные, винительный, исходный падеж)
const UZ: Record<string, string[]> = {
  "2/3": ["uchdan ikki", "uchdan ikkisi", "uchdan ikkisini"],
  "1/2": ["yarim", "yarmi", "yarimi", "yarimini", "yarmini", "yarmidan"],
  "1/4": ["chorak", "choragi", "chorakni", "choragini"],
};

function wordsUz(text: string, key: string): string | null {
  const ws = UZ[key];
  if (!ws) return null;
  const re = new RegExp(`(?<!${L})${alt(ws.map((w) => w.replace(" ", "\\s")))}(?!${L})`, "u");
  return re.exec(text)?.[0] ?? null;
}

export function detectLeak(text: string, answer: string, numbersShown: string[] = []): LeakResult {
  const v = parseAnswer(answer);
  if (!v) return { leaked: false };
  const t = normalizeForMatch(text);
  const N = Number(v.n);
  const D = Number(v.d);
  const isInt = D === 1;
  // сколько раз ответ как число стоит среди операндов: столько цифровых вхождений — не утечка
  let allow = numbersShown.filter((x) => parseAnswer(x)?.equals(v)).length;

  // 1. смешанные «1 1/2» (только неправильные дроби); совпавшие и несовпавшие вырезаем,
  //    чтобы «2 5/6» не читалось как «5/6»
  let rest = t;
  const mixed = /(?<![\d/.,])(\d{1,6}) (\d{1,6}) ?\/ ?(\d{1,6})(?![\d/])/g;
  for (const m of t.matchAll(mixed)) {
    if (m[3] !== "0" && !isInt && new Fraction(BigInt(m[1])).add(new Fraction(BigInt(m[2]), BigInt(m[3]))).equals(v)) {
      return hit(m[0], "mixed");
    }
  }
  rest = rest.replace(mixed, " ");

  // 2. эквиваленты k·n/k·d, k ≤ 10 (в т.ч. «5 / 6»; «5:6» — не дробь, не ловим)
  for (const m of rest.matchAll(/(?<![\d/.,])(\d{1,6}) ?\/ ?(\d{1,6})(?![\d/])/g)) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (b === 0 || a % N !== 0 || a / N > MAX_K || b !== (a / N) * D) continue;
    if (a === N && allow > 0) { allow--; continue; }
    return hit(m[0], a / N === 1 ? "fraction" : "equivalent");
  }

  // 3. десятичные 0.5 / 0,5 — только конечные; 0.50 тоже
  const dec = v.toString();
  if (!isInt && !dec.includes("(")) {
    for (const sep of [".", ","]) {
      const s = dec.replace(".", sep).replace(/[.,]/, (c) => `[${c}]`);
      const m = new RegExp(`(?<![\\d/.,])${s}0*(?![\\d/]|[.,]\\d)`).exec(rest);
      if (m) return hit(m[0], "decimal");
    }
  }

  // 4. слова
  if (isInt) {
    const words = N <= 20 ? [INT_RU[N], INT_RU_FEM[N]].filter(Boolean) : [];
    const m = words.length
      ? new RegExp(`(?<!${L})${alt(words)}(?!${L})`, "u").exec(t)
      : null;
    if (m) return hit(m[0], "word_ru");
    for (const m of rest.matchAll(new RegExp(`(?<![\\d/.,])${N}(?![\\d/]|[.,]\\d)`, "g"))) {
      if (allow > 0) { allow--; continue; }
      return hit(m[0], "fraction");
    }
    return { leaked: false };
  }
  if (N > D) {
    const whole = Math.floor(N / D);
    const mw = mixedWordsRu(t, whole, N - whole * D, D);
    if (mw) return hit(mw, "mixed");
  }
  const ru = wordsRu(t, N, D);
  if (ru) return hit(ru, "word_ru");
  const uz = wordsUz(t, `${N}/${D}`);
  if (uz) return hit(uz, "word_uz");
  return { leaked: false };
}
