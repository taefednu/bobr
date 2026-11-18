/** "k/n" → {k, n} или null (n в 1..24, k ≤ n не проверяется здесь). Только для геометрии, значения не считаются. */
export function parseFraction(value: string): { k: number; n: number } | null {
  const m = /^(\d+)\/(\d+)$/.exec(value);
  if (!m) return null;
  const k = Number(m[1]);
  const n = Number(m[2]);
  return n >= 1 && n <= 24 ? { k, n } : null;
}

/** Округление координат: Math.cos/sin в Node и браузере расходятся в последних знаках, гидрация падает. */
export const r2 = (x: number) => Math.round(x * 100) / 100;
