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
export const CRISIS_PUSH_GAP_MS = 60 * 60_000;

/** ABUSE_HOME среди категорий этого сообщения или в истории ребёнка → родителю НЕ писать вообще (в т.ч. про
 *  SELF_HARM): источником может быть родитель. Только человек из reviewQueue решает, что делать дальше. */
export function parentNotifyDecision(p: { categories: GuardCategory[]; priorAbuse: boolean }): { notify: boolean; urgent: boolean } {
  if (p.priorAbuse || p.categories.includes("ABUSE_HOME")) return { notify: false, urgent: false };
  const routes = p.categories.map(crisisRouting).filter((r) => r?.notifyParent);
  return { notify: routes.length > 0, urgent: routes.some((r) => r?.urgent) };
}

/** Строка reviewQueue про ABUSE_HOME «помнится»: открыта или создана в последние 90 дней. */
export const abuseRowCounts = (r: { category: string; status: string; _creationTime: number }, now: number) =>
  r.category === "ABUSE_HOME" && (r.status === "open" || now - r._creationTime < ABUSE_MEMORY_DAYS * DAY_MS);

/** Флуд: у родителя уже есть неотправленный crisis-пуш или он создан в последний час. */
export function crisisPushSuppressed(
  rows: { parentId: string; kind: string; createdAt: number; sentAt?: number }[], parentId: string, now: number,
): boolean {
  return rows.some((r) => r.parentId === parentId && r.kind === "crisis" && (r.sentAt === undefined || now - r.createdAt < CRISIS_PUSH_GAP_MS));
}
