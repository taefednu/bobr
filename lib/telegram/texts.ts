// Тексты сообщений родителю (бот шлёт их как есть). Только ru/uz; без цитат ребёнка.
// TODO: вычитка носителем (весь uz ниже).
import { CRISIS } from "../config";
import type { Lang } from "../types";

const who = (lang: Lang, name?: string) => name ?? (lang === "ru" ? "Ваш ребёнок" : "Farzandingiz");

export function taughtBobrText(lang: Lang, topicTitle: string, name?: string): string {
  return lang === "ru"
    ? `${who(lang, name)} научил(а) Bobr: «${topicTitle}». Откройте сводку, чтобы увидеть прогресс.`
    : `${who(lang, name)} Bobr'ga «${topicTitle}» mavzusini oʻrgatdi. Taraqqiyotni koʻrish uchun hisobotni oching.`; // TODO: вычитка носителем
}

/** Родителю без цитат: только «что-то серьёзное, поговорите». urgent — SELF_HARM. */
export function crisisText(lang: Lang, urgent: boolean): string {
  const num = CRISIS.confirmedNumbers.join(", ");
  if (lang === "ru")
    return urgent
      ? `Срочно: во время занятия Bobr заметил, что ребёнку может быть тяжело. Пожалуйста, сегодня же спокойно поговорите с ним. Если есть угроза безопасности — звоните ${num}.`
      : "Bobr заметил в разговоре ребёнка что-то, о чём стоит поговорить. Пожалуйста, найдите время спокойно поговорить с ним.";
  // TODO: вычитка носителем
  return urgent
    ? `Shoshilinch: dars paytida Bobr bolaga qiyin boʻlayotganini sezdi. Iltimos, bugunoq u bilan xotirjam gaplashing. Xavf boʻlsa, ${num} ga qoʻngʻiroq qiling.`
    : "Bobr bolaning suhbatida gaplashishga arziydigan narsani sezdi. Iltimos, u bilan xotirjam gaplashib oling.";
}

/** Сводка за сутки: только числа и имя, без цитат ребёнка. */
export function dailySummaryText(lang: Lang, solved: number, taught: number, name?: string): string {
  return lang === "ru"
    ? `${who(lang, name)} за сутки: сам решил(а) тем — ${solved}, научил(а) Bobr — ${taught}. Подробности в сводке.`
    : `${who(lang, name)} bir kunda: oʻzi hal qilgan mavzular — ${solved}, Bobr'ga oʻrgatilgan — ${taught}. Batafsil hisobotda.`; // TODO: вычитка носителем
}

export function forgottenText(lang: Lang, dimmed: number, name?: string): string {
  return lang === "ru"
    ? `${who(lang, name)} давно не заходил(а): домов, которые гаснут, — ${dimmed}. Короткое повторение вернёт им свет.`
    : `${who(lang, name)} anchadan beri kirmadi: soʻna boshlagan uylar — ${dimmed} ta. Qisqa takrorlash ularni yana yoritadi.`; // TODO: вычитка носителем
}
