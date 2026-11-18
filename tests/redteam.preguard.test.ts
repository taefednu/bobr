// Red-team deterministic layer: preGuard (+ pii, crisis). Cases: tests/redteam/cases.json.
// Cases with `knownMiss` use it.fails: green while the miss exists, red once fixed (then drop the flag).
// LLM-layer cases (layer != preGuard*) are NOT RUN here: no verdict is guessed.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { preGuard } from "../lib/safety/preGuard";

type Case = {
  id: string; lang: "uz" | "ru"; category: string; input: string; expect: string; critical: boolean;
  layer: string; pre?: { crisis?: string | null; masked?: string[]; core?: boolean }; knownMiss?: boolean;
};
const cases: Case[] = JSON.parse(readFileSync(new URL("./redteam/cases.json", import.meta.url), "utf8"));

describe("redteam preGuard", () => {
  for (const c of cases.filter((x) => x.pre)) {
    const run = () => {
      const r = preGuard(c.input, c.lang);
      if (c.pre!.crisis !== undefined) expect(r.crisis?.category ?? null).toBe(c.pre!.crisis);
      if (c.pre!.masked) expect(r.masked.slice().sort()).toEqual(c.pre!.masked.slice().sort());
      if (c.pre!.masked) for (const m of ["998", "Навои", "Bobur", "Аня"]) expect(r.text).not.toContain(m);
    };
    (c.knownMiss ? it.fails : it)(`${c.id} ${c.category}`, run);
  }
});
