import { describe, expect, it } from "vitest";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { BobrTurn, GoalDialog, GuardResult, Judge, OutputCheck, UstozTurn } from "../lib/types";

// Ограничения structured outputs (скилл claude-api): каждый объект — additionalProperties:false,
// без открытых словарей. Нарушение = 400 на первом живом вызове, которого ночью не проверить.
function walk(node: unknown, path: string, out: string[]) {
  if (!node || typeof node !== "object") return;
  const n = node as Record<string, unknown>;
  if (n.type === "object" && n.additionalProperties !== false) out.push(path);
  for (const [k, v] of Object.entries(n)) walk(v, `${path}.${k}`, out);
}

const SCHEMAS = { UstozTurn, Judge, BobrTurn, OutputCheck, GoalDialog, GuardResult };

describe("zod-схемы LLM → JSON Schema", () => {
  for (const [name, schema] of Object.entries(SCHEMAS)) {
    it(`${name}: все объекты закрыты`, () => {
      const open: string[] = [];
      walk(zodOutputFormat(schema).schema, name, open);
      expect(open).toEqual([]);
    });
  }

  it("enum без регистра (ci) остаётся enum в схеме, а не «любая строка»", () => {
    const s = JSON.stringify(zodOutputFormat(GuardResult).schema);
    expect(s).toContain('"enum":["SELF_HARM"');
    expect(GuardResult.parse({ category: "self_harm", severity: 3 }).category).toBe("SELF_HARM");
  });
});
