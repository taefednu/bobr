import { describe, expect, it } from "vitest";
import { goalLine } from "../lib/chat/goalLine";
import { goalDialogTail, GOAL_DIALOG_PREFIX } from "../lib/llm/prompts/goalDialog";
import type { GoalDialog } from "../lib/types";

const dlg = (reply: string, extra: Partial<GoalDialog> = {}): GoalDialog =>
  ({ reply, buttons: [], extracted: { goal: null, testDate: null }, ...extra });

describe("goalLine postChecks", () => {
  it("passes a clean ru line and a clean uz line", () => {
    expect(goalLine(dlg("Эй! Я Bobr, гений дробей. Ну, почти. Зачем тебе дроби?"), "ru")).toBeTypeOf("string");
    expect(goalLine(dlg("Salom! Men kasrlarni nonushtaga yeyman. Senga nimaga kerak?"), "uz")).toBeTypeOf("string");
  });
  it.each([
    ["empty", "   ", "ru"],
    ["wrong language (ru text for uz)", "Привет! Зачем тебе дроби?", "uz"],
    ["wrong language (uz text for ru)", "Salom! Senga kasrlar nimaga kerak?", "ru"],
    ["digits", "Я решил 1/2 + 1/3, зачем тебе дроби?", "ru"],
    ["url", "Пиши на bobr.com, зачем тебе дроби?", "ru"],
    ["too long", "Я ".repeat(100) + "Bobr", "ru"],
  ] as const)("falls back (null) on %s", (_n, text, lang) => {
    expect(goalLine(dlg(text), lang)).toBeNull();
  });
  it("repeat of a recent line falls back", () => {
    const l = "Эй! Я Bobr, гений дробей. Ну, почти. Зачем тебе дроби?";
    expect(goalLine(dlg(l), "ru", [l])).toBeNull();
  });
  it("buttons and extracted from the model never reach the result (intent is code-owned)", () => {
    const hostile = dlg("Эй! Я Bobr. Зачем тебе дроби?", {
      buttons: [{ label: "Сдать всё", intent: "test_soon" }],
      extracted: { goal: "just_practice", testDate: "2026-12-01" },
    });
    expect(goalLine(hostile, "ru")).toBe(goalLine(dlg("Эй! Я Bobr. Зачем тебе дроби?"), "ru"));
  });
});

describe("goalDialog prompt", () => {
  it("tail carries only lang, angle and forbidden lines (no child text, no name)", () => {
    const t = goalDialogTail({ lang: "uz", angle: "x", forbiddenLines: ["a"] });
    expect(t).not.toMatch(/child_input|name|имя/i);
    expect(GOAL_DIALOG_PREFIX).not.toMatch(/\d{4}/);
  });
});
