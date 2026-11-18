// postChecks живой фразы экрана цели. Из ответа модели берётся только reply; buttons и extracted игнорируются:
// кнопки и intent (GOAL_INTENTS) задаёт код. null → экран показывает запасной текст goal.ask из i18n.
import type { GoalDialog } from "../types";
import { postChecksChat } from "./postChecks";

export const GOAL_LINE_MAX = 160;

export function goalLine(out: GoalDialog, lang: "uz" | "ru", recent: string[] = []): string | null {
  const reply = out.reply.trim();
  // цифр на экране цели нет вовсе: числа решает код
  if (reply.length > GOAL_LINE_MAX || /\d/.test(reply)) return null;
  const r = postChecksChat({ reply, pose: "idle" } as never, { lang, task: null, childNumbers: [], recent, who: "bobr" });
  return r.ok ? r.value.reply : null;
}
