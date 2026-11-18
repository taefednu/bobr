import { describe, expect, it } from "vitest";
import { numberCheck } from "../lib/fractions/numberCheck";

describe("numberCheck", () => {
  it("equal multiset is ok; fractions split into integers", () => {
    expect(numberCheck("Сложи 1/2 и 1/3", ["1/2", "1/3"])).toEqual({ ok: true, extra: [], missing: [] });
    expect(numberCheck("У Бобра 3/10 бревна", ["3", "10"]).ok).toBe(true);
  });
  it("order does not matter", () => {
    expect(numberCheck("3 и потом 10", ["10", "3"]).ok).toBe(true);
  });
  it("extra number", () => {
    expect(numberCheck("Сложи 1/2 и 1/3, будет 5/6", ["1/2", "1/3"])).toEqual({
      ok: false, extra: ["5", "6"], missing: [],
    });
  });
  it("missing number", () => {
    expect(numberCheck("Сложи 1/2", ["1/2", "1/3"])).toEqual({ ok: false, extra: [], missing: ["1", "3"] });
  });
  it("multiplicity counts", () => {
    expect(numberCheck("1/2 и 1/2", ["1/2"])).toEqual({ ok: false, extra: ["1", "2"], missing: [] });
    expect(numberCheck("3", ["3", "3"])).toEqual({ ok: false, extra: [], missing: ["3"] });
  });
  it("decimals are one token, comma = dot", () => {
    expect(numberCheck("это 0,5", ["0.5"]).ok).toBe(true);
    expect(numberCheck("это 0.5", ["0,5"]).ok).toBe(true);
    expect(numberCheck("это 0,5", ["0", "5"]).ok).toBe(false);
  });
  it("½ counts as 1 and 2; words are not numbers", () => {
    expect(numberCheck("половина = ½", ["1", "2"]).ok).toBe(true);
    expect(numberCheck("пять шестых", []).ok).toBe(true);
  });
});
