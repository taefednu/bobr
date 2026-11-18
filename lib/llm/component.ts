// Компонент урока: что просит модель (LlmComponent) проверяет и при отказе строит код. Картинка рисуется ВСЕГДА:
// модель выбирает только тип и дроби из операндов; всё остальное — запасной компонент из операндов задачи.
import Fraction from "fraction.js";
import type { UstozTurn } from "../types";
import { postChecksUstoz, type UstozCtx } from "./postChecks";

export type LlmComponent = NonNullable<UstozTurn["component"]>;
/** Как лежит в БД и уходит в UI (convex/schema.ts): params f1…f3 — дроби строкой. */
export type StoredComponent = { type: LlmComponent["type"]; params: { key: string; value: string }[] };
export type ComponentCtx = { operands: string[]; childFractions: string[]; answer: string };

const same = (a: string, b: string) => {
  try { return new Fraction(a).equals(new Fraction(b)); } catch { return false; }
};

export function normalizeComponent(c: LlmComponent | null, ctx: ComponentCtx): { component: LlmComponent; from: "model" | "code" } {
  const type = c?.type ?? "pie";
  const ok = (f: string) => {
    const m = /^(\d+)\/(\d+)$/.exec(f);
    if (!m) return false;
    const [n, d] = [Number(m[1]), Number(m[2])];
    if (d < 2 || d > 12 || n > (type === "line" ? 3 * d : d)) return false;
    // операнд — всегда можно; дробь ребёнка — если она не ответ и не равна ему
    return ctx.operands.includes(f) || (ctx.childFractions.includes(f) && !same(f, ctx.answer));
  };
  const fr = [...new Set((c?.fractions ?? []).map((f) => f.replace(/\s/g, "")))];
  if (c && fr.length >= 1 && fr.length <= 3 && fr.every(ok)) return { component: { type, fractions: fr }, from: "model" };
  return { component: { type, fractions: ctx.operands.filter((f) => /^\d+\/\d+$/.test(f)).slice(0, 3) }, from: "code" };
}

export const toStored = (c: LlmComponent): StoredComponent | null =>
  c.fractions.length ? { type: c.type, params: c.fractions.map((value, i) => ({ key: `f${i + 1}`, value })) } : null;

/** Путь хода Ustoz после zod: компонент нормализует код, затем postChecks. Один вход для turn.ts и тестов. */
export function postUstoz(out: UstozTurn, ctx: UstozCtx & Omit<ComponentCtx, "answer">) {
  const { component, from } = normalizeComponent(out.component, ctx);
  return { result: postChecksUstoz({ ...out, component }, ctx), from };
}
