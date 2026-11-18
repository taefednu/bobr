// Детское имя (students.displayName) не должно попасть в промпты LLM, turns, llmCache и логи.
// Читать его вправе только функции родителя; эти файлы — путь хода ребёнка и всё, что говорит с LLM.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const walk = (d: string): string[] =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const files = [
  "convex/turn.ts", "convex/chat.ts", "convex/conductor.ts", "convex/lesson.ts", "convex/lessonView.ts", "convex/llmCache.ts", "convex/debug.ts",
  ...walk("lib/llm"), ...walk("lib/safety"), ...walk("lib/chat"),
];

describe("displayName stays out of the LLM / turns path", () => {
  it.each(files)("%s", (f) => {
    expect(readFileSync(f, "utf8")).not.toMatch(/displayName/);
  });
});
