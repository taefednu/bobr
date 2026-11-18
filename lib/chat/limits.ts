// Лимиты болталки (спека: закрыта 21:00–07:00, 15 мин за сессию, 30 мин в день). Чистые функции: время приходит аргументом.
// Лимиты общие для Ustoz и Bobr. Время считаем по паузам между сообщениями ребёнка в чате.
import { CHAT } from "../config";

export const GAP_CAP_MS = 2 * 60_000; // каждая пауза засчитывается не больше 2 минут
export const NEW_SESSION_GAP_MS = 10 * 60_000; // пауза дольше 10 минут начинает новую сессию
const TASHKENT_MS = 5 * 3_600_000; // Asia/Tashkent = UTC+5 без перехода на летнее время

export type ChatAccess = {
  open: boolean;
  reason: null | "night" | "session_limit" | "day_limit" | "crisis_block";
  minutesLeft: number;
};

const local = (now: number) => new Date(now + TASHKENT_MS);
/** "YYYY-MM-DD" локального (Ташкент) дня. */
export const localDay = (now: number): string => local(now).toISOString().slice(0, 10);
export const isNight = (now: number): boolean => {
  const h = local(now).getUTCHours();
  return h >= CHAT.closedFromHour || h < CHAT.closedToHour;
};

/** Сколько мс эта пауза добавляет к счётчикам: 0, если началась новая сессия. */
export const gapCost = (prevTs: number | null, now: number): number =>
  prevTs === null || now - prevTs > NEW_SESSION_GAP_MS ? 0 : Math.min(Math.max(now - prevTs, 0), GAP_CAP_MS);

/** Потрачено в текущей сессии: ts — времена сообщений ребёнка по возрастанию, now — момент проверки. */
export function sessionMs(ts: number[], now: number): number {
  if (!ts.length || now - ts[ts.length - 1] > NEW_SESSION_GAP_MS) return 0;
  let sum = 0;
  for (let i = ts.length - 1; i > 0 && ts[i] - ts[i - 1] <= NEW_SESSION_GAP_MS; i--) sum += gapCost(ts[i - 1], ts[i]);
  return sum;
}

/** Дневной счётчик после нового сообщения ребёнка в момент now. */
export const bumpDay = (s: { chatDay?: string; chatMsToday?: number }, prevTs: number | null, now: number) => {
  const day = localDay(now);
  return { chatDay: day, chatMsToday: (s.chatDay === day ? (s.chatMsToday ?? 0) : 0) + gapCost(prevTs, now) };
};

export function checkAccess(a: {
  now: number; blockedUntil?: number; chatDay?: string; chatMsToday?: number; ts: number[];
}): ChatAccess {
  const closed = (reason: NonNullable<ChatAccess["reason"]>): ChatAccess => ({ open: false, reason, minutesLeft: 0 });
  if ((a.blockedUntil ?? 0) > a.now) return closed("crisis_block");
  if (isNight(a.now)) return closed("night");
  const dayLeft = CHAT.dayMinutes * 60_000 - (a.chatDay === localDay(a.now) ? (a.chatMsToday ?? 0) : 0);
  if (dayLeft <= 0) return closed("day_limit");
  const sessionLeft = CHAT.sessionMinutes * 60_000 - sessionMs(a.ts, a.now);
  if (sessionLeft <= 0) return closed("session_limit");
  return { open: true, reason: null, minutesLeft: Math.ceil(Math.min(dayLeft, sessionLeft) / 60_000) };
}
