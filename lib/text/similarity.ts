// Сходство двух коротких текстов: Жаккар по символьным триграммам. Символьные, а не словные:
// на реплике из 1–2 предложений словных триграмм почти нет, а узбекские суффиксы
// (olti/oltita/oltidan) символьные триграммы переживают.
import { normalizeForMatch } from "./normalize";

function trigrams(s: string): Set<string> {
  const words = normalizeForMatch(s)
    .replace(/'/g, "") // апостроф — часть буквы (oʻ → o), не разделитель
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(" ")
    .filter(Boolean);
  const out = new Set<string>();
  for (const w of words) {
    const p = ` ${w} `; // границы слова входят в триграммы
    for (let i = 0; i + 3 <= p.length; i++) out.add(p.slice(i, i + 3));
  }
  return out;
}

/** 0..1. Пустой текст (после нормализации) → 0, не NaN. */
export function trigramJaccard(a: string, b: string): number {
  const A = trigrams(a);
  const B = trigrams(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}
