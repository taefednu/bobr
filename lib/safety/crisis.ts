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
