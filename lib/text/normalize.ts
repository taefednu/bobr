// Общая нормализация текста ребёнка и реплик для сравнения: parseAnswer, leakDetector, copyCheck,
// repeatGuard, preGuard. Только для сравнения — показывать ребёнку исходный текст, не этот.

/** Zero-width и прочие невидимые: ZWSP, ZWNJ, ZWJ, WORD JOINER, BOM, soft hyphen. */
const INVISIBLE = /[\u200B-\u200D\u2060\uFEFF\u00AD]/g;

/** Все виды апострофа/кавычки-апострофа → ASCII `'`. В узбекском `oʻ gʻ` (U+02BB) и tutuq belgisi
 *  (U+02BC) дети набирают как ' ’ ‘ ` — для сравнения это одна буква. */
const APOSTROPHES = /[\u02BB\u02BC\u2018\u2019\u201B`\u00B4\u02B9\u02BE\u02BF]/g;

/** Дробные символы ½ ⅓ ¼ … NFKC раскладывает в «1⁄2» без пробела: «1½» стал бы «11⁄2» = 11/2.
 *  Поэтому до NFKC каждый такой символ получает пробел впереди, а дробная черта U+2044 → `/`. */
const VULGAR = /[\u00BC-\u00BE\u2150-\u215E\u2189]/g;
const FRACTION_SLASH = /[\u2044\u2215]/g;

/** Дефисы и тире всех видов → ASCII `-`. */
const DASHES = /[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g;

/** trim → ½ с пробелом → NFKC → убрать невидимые → апострофы, дефисы, дробная черта к одному виду →
 *  схлопнуть пробелы. Регистр не трогает. */
export function normalizeText(s: string): string {
  return s
    .replace(VULGAR, (c) => " " + c)
    .normalize("NFKC")
    .replace(FRACTION_SLASH, "/")
    .replace(INVISIBLE, "")
    .replace(APOSTROPHES, "'")
    .replace(DASHES, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/** Для поиска слов: normalizeText + нижний регистр + ё→е. */
export function normalizeForMatch(s: string): string {
  return normalizeText(s).toLowerCase().replace(/ё/g, "е");
}
