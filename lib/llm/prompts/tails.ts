// Хвосты промптов: всё переменное. Ввод ребёнка — только внутри ограждения, роли сообщений задаёт код.
import type { Lang } from "../../types";
import { fence, fenceChildInput } from "./fence";

/** Публичная проекция задачи: БЕЗ answer и distractors. */
export type PublicTask = { kind: string; params: Record<string, string>; numbersShown: string[] };

export function ustozTail(a: {
  lang: Lang;
  beat: string;
  task: PublicTask;
  /** вердикт кода, например "misconception:M9", "ok", "wrong" */
  verdict: string;
  hintLevel: number;
  forbiddenLines: string[];
  childInput: string;
}): string {
  const params = Object.entries(a.task.params).map(([k, v]) => `${k}=${v}`).join("; ");
  return [
    `<lang>${a.lang}</lang>`,
    `<beat>${a.beat}</beat>`,
    `<task kind="${a.task.kind}">${params}</task>`,
    `<numbers_shown>${a.task.numbersShown.join(", ")}</numbers_shown>`,
    `<verdict>${a.verdict}</verdict>`,
    `<hint_level>${a.hintLevel}</hint_level>`,
    `<forbidden_lines>\n${a.forbiddenLines.map((l) => `- ${l.replace(/\s+/g, " ")}`).join("\n")}\n</forbidden_lines>`,
    fenceChildInput(a.childInput),
  ].join("\n");
}

export function guardTail(a: { lang: Lang; last6: string[]; riskCount: number; childInput: string }): string {
  return [
    `<lang>${a.lang}</lang>`,
    `<risk_count>${a.riskCount}</risk_count>`,
    `<history>\n${a.last6.slice(-6).map((m) => fenceChildInput(m)).join("\n")}\n</history>`,
    fenceChildInput(a.childInput),
  ].join("\n");
}

export const outputCheckTail = (a: { reply: string }): string => fence("reply_to_check", a.reply);
