// CRISIS: фиксированный шаблон (не генерация LLM) и маршрутизация по категории (спека → «Кому сообщать»).
import { CRISIS } from "../config";
import type { GuardCategory } from "../types";

export type CrisisMessage = { trustedAdultFirst: string; numbers: readonly string[] };

// TODO(content): crisis.json — финальный текст вычитывает носитель (uz и ru). Это заглушка, не выдавать за готовый.
// Номера — только CRISIS.confirmedNumbers (подтверждён 112); новые не добавлять без звонка.
const MESSAGES = {
  ru: "[ЗАГЛУШКА — текст вычитает носитель] Поговори со взрослым, которому доверяешь.",
  uz: "[ZAGLUSHKA — matnni ona tili egasi tekshiradi] Ishonchli kattalar bilan gaplash.",
} as const;

export function crisisMessage(lang: "uz" | "ru"): CrisisMessage {
  return { trustedAdultFirst: MESSAGES[lang], numbers: CRISIS.confirmedNumbers };
}

export type CrisisRouting = {
  notifyParent: boolean;
  urgent: boolean;
  /** родителю без цитат ребёнка */
  noQuotes: boolean;
  /** флаг в reviewQueue (модерация) */
  reviewQueue: boolean;
};

/** Спека: SELF_HARM → родителю срочно, без цитат; ABUSE_HOME → родителю НЕ сообщать (родитель может быть
 *  источником), в reviewQueue; GROOMING → родителю. Остальные категории — не кризис: null. */
export function crisisRouting(category: GuardCategory): CrisisRouting | null {
  switch (category) {
    case "SELF_HARM":
      return { notifyParent: true, urgent: true, noQuotes: true, reviewQueue: false };
    case "ABUSE_HOME":
      return { notifyParent: false, urgent: false, noQuotes: false, reviewQueue: true };
    case "GROOMING":
      return { notifyParent: true, urgent: false, noQuotes: false, reviewQueue: false };
    default:
      return null;
  }
}

const DAY_MS = 86_400_000;
export const ABUSE_MEMORY_DAYS = 90;

/** ABUSE_HOME среди категорий этого сообщения или в истории ребёнка → родителю НЕ писать вообще (в т.ч. про
 *  SELF_HARM): источником может быть родитель. Только человек из reviewQueue решает, что делать дальше. */
export function parentNotifyDecision(p: { categories: GuardCategory[]; priorAbuse: boolean }): { notify: boolean; urgent: boolean } {
  if (p.priorAbuse || p.categories.includes("ABUSE_HOME")) return { notify: false, urgent: false };
  const routes = p.categories.map(crisisRouting).filter((r) => r?.notifyParent);
  return { notify: routes.length > 0, urgent: routes.some((r) => r?.urgent) };
}

/** Строка reviewQueue про ABUSE_HOME «помнится»: открыта или создана в последние 90 дней — ЛЮБОЙ severity (fail closed:
 *  слабый сигнал о насилии дома тоже не даёт отправить пуш родителю-источнику). Тишины нет: удержанный пуш всегда
 *  пишет строку withheldPush (severity 4) — её видит человек. Снять — закрыть строку ревью (status ≠ open) и подождать 90 дней. */
// Окончательное правило (18.11): удержание отпускает человек, не время. Открытый (непроверенный) флаг ABUSE_HOME
// удерживает пуш всегда, при любом severity. Закрытый человеком: слабый (severity 1) перестаёт действовать через
// 24 ч, сильный (≥ 2) — через 90 дней. Удержание всегда видно (withheldPush); кто его читает — BLOCKERS B11.
export const WEAK_ABUSE_HOURS = 24;
export const abuseRowCounts = (r: { category: string; status: string; severity: number; _creationTime: number }, now: number) =>
  r.category === "ABUSE_HOME" && (r.status === "open" ||
    now - r._creationTime < (r.severity >= 2 ? ABUSE_MEMORY_DAYS * DAY_MS : WEAK_ABUSE_HOURS * 3_600_000));

export const ABUSE_LOOKUP_BOUND = 100;

/** rows — ABUSE_HOME-строки ребёнка, от новых к старым, прочитанные с лимитом ABUSE_LOOKUP_BOUND. Упёрлись в лимит без
 *  ответа → считаем, что насилие было (fail closed): лучше не отправить пуш, чем отправить родителю-источнику. */
export function priorAbuseFrom(rows: { category: string; status: string; severity: number; _creationTime: number }[], now: number): boolean {
  if (rows.some((r) => abuseRowCounts(r, now))) return true;
  return rows.length >= ABUSE_LOOKUP_BOUND;
}

/** Стухшая неотправленная строка (бот лежит) уже не защищает от повторного пуша. */
export const CRISIS_DEDUPE_STALE_MS = 10 * 60_000;

export const crisisDedupeKey = (studentId: string, category: string) => `crisis:${studentId}:${category}`;

/** Только точный дубль: у родителя уже есть НЕОТПРАВЛЕННАЯ (и не старше 10 мин) crisis-строка с тем же dedupeKey.
 *  Лимита «раз в час» нет — спека: SELF_HARM/GROOMING шлются сразу. Неурочная строка срочную не гасит. */
export function crisisPushSuppressed(
  rows: { dedupeKey?: string; urgent?: boolean; createdAt: number; sentAt?: number }[], dedupeKey: string, urgent: boolean, now: number,
): boolean {
  // Первый пуш эпизода уходит сразу (лимита нет — SPEC_SYSTEM §5). Повтор того же (ребёнок, категория) склеивается,
  // пока предыдущий не отправлен или отправлен < 10 мин назад; несрочная строка срочную не гасит.
  return rows.some((r) => r.dedupeKey === dedupeKey && (r.urgent === true || !urgent) && (
    r.sentAt === undefined ? now - r.createdAt < CRISIS_DEDUPE_STALE_MS : now - r.sentAt < CRISIS_DEDUPE_STALE_MS));
}
