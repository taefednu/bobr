import { describe, expect, it } from "vitest";
import { repeatGuard } from "../lib/safety/repeatGuard";

const A = "Давай посмотрим на дом: сколько этажей у знаменателя?";

describe("repeatGuard", () => {
  it("почти та же реплика — повтор", () => {
    expect(repeatGuard("Давай посмотрим на дом: сколько этажей у знаменателя", [A]).repeat).toBe(true);
  });
  it("другая реплика — не повтор", () => {
    expect(repeatGuard("Отлично! Теперь попробуй сложить числители.", [A]).repeat).toBe(false);
  });
  it("смотрит только последние 30", () => {
    const filler = Array.from({ length: 30 }, (_, i) => `реплика ${i} про бобров и плотину`);
    expect(repeatGuard(A, [A, ...filler]).repeat).toBe(false);
    expect(repeatGuard(A, [A, ...filler.slice(1)]).repeat).toBe(true);
  });
  it("пустое безопасно", () => {
    expect(repeatGuard("", [A])).toEqual({ repeat: false, score: 0 });
    expect(repeatGuard(A, [])).toEqual({ repeat: false, score: 0 });
  });
});
