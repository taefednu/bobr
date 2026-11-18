// preGuard (код, до всего): лимит → нормализация → транслит/base64/дефисы (только для сравнения) →
// маска ПДн → высокоточные триггеры от первого лица → CRISIS. Не режется никогда. Скилл: bobr-safety.
// Всё неоднозначное → crisis: null; дальше решает LLM-guard с контекстом.
import { THRESHOLDS } from "../config";
import { normalizeText } from "../text/normalize";
import type { GuardCategory } from "../types";
import { maskPii, type PiiKind } from "./pii";

export type PreGuardResult = {
  /** нормализованный + с маской ПДн: можно отдавать LLM и писать в БД */
  text: string;
  tooLong: boolean;
  /** виды замаскированного (не значения) */
  masked: PiiKind[];
  /** trigger — id триггера, не текст ребёнка */
  crisis: null | { category: GuardCategory; trigger: string };
  /** мягкий триггер совпал, но его погасил маркер гиперболы: без LLM-guard это слепая зона — вызывающий пишет флаг */
  suppressed?: { category: GuardCategory; trigger: string };
};

// Решение: длиннее лимита → обрезаем до лимита (в LLM и БД идёт только начало), tooLong=true. Триггеры при
// этом ищем в первых 4×лимита нормализованного текста: «кризис в хвосте длинного сообщения» не теряется.
const MATCH_CAP = THRESHOLDS.preGuardMaxInput * 4;

// --- Транслит для сравнения: кириллица → латиница; триггеры (их исходники) проходят через ту же функцию. ---
// Апострофы НЕ удаляем: «oʻlgim» (умереть) и «olgim» (взять) — разные слова. ў → o', ғ → g'.
const TR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "j", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh",
  щ: "shch", ъ: "", ы: "i", ь: "", э: "e", ю: "yu", я: "ya", ў: "o'", қ: "q", ғ: "g'", ҳ: "h",
};
// Латинская x → h: «xochu umeret» (ru латиницей) и uz «x» (= х) сходятся с кириллическим «х».
const canon = (s: string) =>
  s.toLowerCase().replace(/ё/g, "е").replace(/[а-яўқғҳ]/g, (c) => TR[c] ?? c).replace(/x/g, "h");

// «у-м-е-р-е-т-ь», «o.l.d.i.m»: одиночные буквы через один разделитель → склеить. Пробелы между буквами
// не склеиваем (односимвольные слова «я», «в» дали бы ложные склейки) — это уже работа LLM-guard.
const SPLIT_LETTERS = /(?<![\p{L}])\p{L}(?:\s?[-.*_,~·+|/\\]\s?\p{L}){2,}(?![\p{L}])/gu;
const collapseSplit = (s: string) => s.replace(SPLIT_LETTERS, (m) => m.replace(/[^\p{L}]/gu, ""));

// base64-токен (≥16 знаков), который декодируется в читаемый UTF-8 текст → в сравнение (не в text).
function decodeBase64(s: string): string[] {
  const out: string[] = [];
  for (const [tok] of s.matchAll(/[A-Za-z0-9+/]{16,}={0,2}/g)) {
    try {
      const b = tok.replace(/=+$/, "");
      const bin = atob(b.padEnd(Math.ceil(b.length / 4) * 4, "="));
      const dec = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
      if (/^[\p{L}\p{N}\p{P}\p{Z}\p{S}]+$/u.test(dec)) out.push(dec);
    } catch {
      /* не base64 / не текст */
    }
  }
  return out;
}

type Trigger = {
  id: string;
  category: GuardCategory;
  re: RegExp;
  /** слова после триггера, при которых это не кризис («хочу умереть СО смеху») */
  notNext?: string[];
  /** в том же предложении маркеры гиперболы («скучно», «смеху») → не кризис */
  soft?: boolean;
};

const mk = (id: string, category: GuardCategory, src: string, opts: Partial<Trigger> = {}): Trigger => ({
  id,
  category,
  re: new RegExp(`(?<![\\p{L}])(?:${canon(src)})(?![\\p{L}])`, "gu"),
  ...opts,
  notNext: opts.notNext?.map(canon),
});

// Только первое лицо, высокая точность. SELF_HARM раньше ABUSE_HOME.
// Исходники пишутся на родном языке и канонизируются той же функцией, что и текст ребёнка.
// Список короткий намеренно: всё, чего тут нет, ловит LLM-guard.
const TRIGGERS: Trigger[] = [
  // --- ru --- не вычитано носителем
  mk("ru_want_die", "SELF_HARM", "хочу\\s+умереть", { soft: true, notNext: ["со", "с", "от"] }),
  mk("ru_end_life", "SELF_HARM", "хочу\\s+покончить\\s+с\\s+собой|покончу\\s+с\\s+собой"),
  mk("ru_kill_self", "SELF_HARM", "убью\\s+себя|хочу\\s+(?:убить\\s+себя|себя\\s+убить)"),
  mk("ru_no_live", "SELF_HARM", "не\\s+хочу\\s+жить", {
    soft: true,
    notNext: ["в", "с", "со", "у", "здесь", "тут", "там", "рядом", "без", "на", "при", "по", "к", "дома", "одна", "один"],
  }),
  mk(
    "ru_abuse_home",
    "ABUSE_HOME",
    "меня\\s+бьют\\s+дома|дома\\s+меня\\s+бьют|(?:папа|мама|отец|отчим|мачеха)\\s+меня\\s+(?:бьет|бил|била|избивает)|меня\\s+(?:бьет|избивает)\\s+(?:папа|мама|отец|отчим|мачеха)|(?:папа|мама|отец|отчим|мачеха)\\s+(?:бьет|бил|била|избивает)\\s+меня",
  ),
  // --- uz-Latn --- не вычитано носителем
  // «oʻlgim» с апострофом обязателен: «olgim keladi» = «хочу взять».
  mk("uz_want_die", "SELF_HARM", "o'lgim\\s+keladi", { soft: true }),
  mk("uz_kill_self", "SELF_HARM", "(?:o'?|u)zimni\\s+(?:o'?|u)ldiraman|(?:o'?|u)zimni\\s+(?:o'?|u)ldirmoqchiman"),
  mk("uz_no_live", "SELF_HARM", "yashagim\\s+kelmaydi", { soft: true }),
  mk(
    "uz_abuse_home",
    "ABUSE_HOME",
    "uyda\\s+meni\\s+ur(?:ishadi|adi|adilar)|meni\\s+uyda\\s+ur(?:ishadi|adi|adilar)|(?:dadam|onam|otam)\\s+meni\\s+(?:ur(?:adi|ishadi)|kaltakl(?:aydi|ashadi))", // kaltakla- не вычитано носителем
  ),
];

// Маркеры гиперболы (после canon): скука, смех, стыд-смех. Для soft-триггеров, в пределах предложения.
// «uyal» убран: с носителями не согласован.
const SOFT_MARKERS = ["скук", "скучн", "смех", "смеш", "zerik", "kulg", "kulib"].map(canon);

// Маркер под отрицанием («мне не смешно», «kulgim kelmayapti») — не гипербола, а жалоба: триггер остаётся.
const markerHolds = (clause: string): boolean =>
  SOFT_MARKERS.some((w) => {
    for (const m of clause.matchAll(new RegExp(`(?<![\\p{L}])${w}`, "gu"))) {
      const before = clause.slice(0, m.index);
      const after = clause.slice(m.index);
      const negated =
        /(?<![\p{L}])(?:ne|nikogda|hech)\s+(?:\p{L}+\s+)?$/u.test(before) || // не смешно, не очень смешно
        /^\p{L}*\s+(?:emas|kelmay\p{L}*|yoq)(?![\p{L}])/u.test(after); // kulgim kelmayapti, kulgi emas
      if (!negated) return true;
    }
    return false;
  });

function findTrigger(v: string): { t: Trigger | null; suppressed: Trigger | null } {
  let suppressed: Trigger | null = null;
  const clauses = v.split(/[.!?;\n]+/);
  for (const t of TRIGGERS) {
    for (const clause of clauses) {
      for (const m of clause.matchAll(t.re)) {
        const before = clause.slice(0, m.index);
        const after = clause.slice(m.index + m[0].length);
        if (/(?<![\p{L}])ne\s*$/u.test(before)) continue; // «не хочу умереть»
        const next = /^\s*(\p{L}+)/u.exec(after)?.[1];
        if (next && t.notNext?.includes(next)) continue;
        if (t.soft && markerHolds(clause)) {
          suppressed ??= t;
          continue;
        }
        return { t, suppressed };
      }
    }
  }
  return { t: null, suppressed };
}

export function preGuard(raw: string, lang: "uz" | "ru"): PreGuardResult {
  void lang; // триггеры двуязычные: ru-раскладкой часто пишут узбекский и наоборот
  const limit = THRESHOLDS.preGuardMaxInput;
  const chars = Array.from(raw);
  const tooLong = chars.length > limit;

  const { text, kinds } = maskPii(normalizeText(chars.slice(0, limit).join("")));

  const norm = normalizeText(chars.slice(0, MATCH_CAP).join(""));
  const variants = [norm, ...decodeBase64(norm)].flatMap((s) => {
    const lower = s.toLowerCase();
    return [canon(lower), canon(collapseSplit(lower))];
  });
  let suppressed: Trigger | null = null;
  for (const v of variants) {
    const r = findTrigger(v);
    if (r.t) return { text, tooLong, masked: kinds, crisis: { category: r.t.category, trigger: r.t.id } };
    suppressed ??= r.suppressed;
  }
  return {
    text, tooLong, masked: kinds, crisis: null,
    ...(suppressed && { suppressed: { category: suppressed.category, trigger: suppressed.id } }),
  };
}
