// Лепёшка в пузыре чата: код берёт первую правильную дробь с малым знаменателем из сохранённого текста реплики.
// Ложное арифметическое утверждение в тексте (scanMath) — картинки нет. Дробь строкой, без float.
import { normalizeText } from "../text/normalize";
import { scanMath } from "./claims";

export type Visual = { type: "pie"; fraction: string };
export const PIE_MAX_DENOMINATOR = 12;

const FRAC = /(?<![\d/.,])(\d{1,2})\/(\d{1,2})(?![\d/])/gu;

// ponytail: «3/4 мая» тоже даст лепёшку; дата в реплике Ustoz редкость, фильтр — когда появится в живых данных.
export function pieVisual(text: string): Visual | null {
  if (scanMath(text).claims.some((c) => !c.ok)) return null;
  for (const m of normalizeText(text).matchAll(FRAC)) {
    const n = Number(m[1]);
    const d = Number(m[2]);
    if (n >= 1 && n < d && d <= PIE_MAX_DENOMINATOR) return { type: "pie", fraction: `${n}/${d}` };
  }
  return null;
}
