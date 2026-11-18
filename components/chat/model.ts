// Контракт болталки (convex/chat.ts: chat:view, chat:send) и пороги экрана.
export type Partner = "ustoz" | "bobr";
export const PARTNERS: Partner[] = ["ustoz", "bobr"];

/** Картинка к реплике: код берёт дробь из сохранённого текста (lib/chat/visual.ts), у ребёнка всегда null. */
export type Visual = { type: "pie"; fraction: string };
export type ChatMsg = { id: string; role: "child" | Partner; text: string; ts: number; visual?: Visual | null };
export type ClosedReason = "night" | "session_limit" | "day_limit" | "crisis_block";
export type ChatData = {
  who: Partner;
  messages: ChatMsg[];
  pose: string | null;
  access: { open: boolean; reason: ClosedReason | null; minutesLeft: number };
};
export type SendStatus = "replied" | "fallback" | "closed" | "crisis" | "rejected";
/** Что показать, кроме самой переписки, когда отправка не дала обычного ответа. */
export type Notice = "fallback" | "rejected" | "error";

export const MAX_LEN = 500;
/** Счётчик символов виден только у предела, чтобы не давить на ребёнка. */
export const COUNT_FROM = 400;
/** Остаток времени показываем, только когда он мал (минуты): предупреждение в открытой болталке и обратный отсчёт в закрытой. */
export const LEFT_NOTE_MIN = 5;
export const WAIT_SHOW_MIN = 60;
/** Сообщение свежее этого возраста въезжает с анимацией; старая история стоит на месте. */
export const FRESH_MS = 4000;
