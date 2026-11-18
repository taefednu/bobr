// Вход для Python-бота: каждая его функция публична, но требует botSecret == env BOT_SECRET (constant-time).
// Нет BOT_SECRET в env → закрыто для всех. Текст ошибки одинаковый и без значений.
import { timingSafeEqual } from "../lib/telegram/secure";

// eslint-disable-next-line @convex-dev/no-process-env -- чтение на каждый вызов: `convex env set` действует без передеплоя (как в turn.ts)
export const env = (k: string) => process.env[k];

export function assertBot(botSecret: string): void {
  const expected = env("BOT_SECRET");
  if (!expected || !timingSafeEqual(botSecret, expected)) throw new Error("unauthorized");
}
