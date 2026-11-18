// Чистая логика экрана «Научи Bobr»: что показать по ответу сервера. Текст — только из ответа или из i18n по ключу, который вернул бэкенд.
import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";
import type { Key } from "@/lib/i18n";

export type TeachReply = FunctionReturnType<typeof api.teach.explain>;

const LINE_KEYS = [
  "teach.copyCheck", "teach.line.entry", "teach.line.question", "teach.line.wrong_rule", "teach.line.solved", "teach.line.give_up",
] as const;

/** Реплика Bobr: текст модели → ключ i18n от бэкенда → ключ по beat. Пусто только если ответа нет вовсе. */
export function lineText(r: TeachReply | null, t: (k: Key) => string): string | null {
  if (!r) return null;
  if (r.reply) return r.reply;
  if (r.lineKey && (LINE_KEYS as readonly string[]).includes(r.lineKey)) return t(r.lineKey as Key);
  if (r.beat) return t(`teach.line.${r.beat}` as Key);
  return null;
}

/** Выражение Bobr в токены: дроби рисуются стопкой, остальное текстом. «?» в выражении заменяется его ответом. */
export function slateTokens(expression: string, attempt: string): { kind: "frac" | "text"; value: string }[] {
  const full = expression === "?" ? attempt : expression.includes("?") ? expression.replace("?", attempt) : `${expression} = ${attempt}`;
  return full
    .split(/(\d+\/\d+)/)
    .filter((s) => s.trim() !== "")
    .map((s) => (/^\d+\/\d+$/.test(s) ? { kind: "frac", value: s } : { kind: "text", value: s.trim() }));
}
