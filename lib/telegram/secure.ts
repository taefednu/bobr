// Сравнение секретов за время, не зависящее от места первого расхождения. Без Node-зависимостей (Convex default runtime).
/** Сравнивает по всей длине длиннейшей строки; длина тоже входит в результат, но не обрывает цикл. */
export function timingSafeEqual(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

/** n случайных символов из алфавита (crypto, не Math.random). Алфавит ≤ 256 символов; смещение от `%` — ничтожно для токенов. */
export function randomString(alphabet: string, n: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}
