import { describe, expect, it } from "vitest";
import { copyCheck } from "../lib/safety/copyCheck";

const RU = "Чтобы сложить дроби с разными знаменателями, сначала приведи их к общему знаменателю.";
const UZ = "Maxrajlari har xil kasrlarni qoʻshish uchun avval ularni umumiy maxrajga keltir.";

describe("copyCheck", () => {
  it("дословная копия", () => {
    const r = copyCheck(RU, ["привет", RU]);
    expect(r.copied).toBe(true);
    expect(r.against).toBe(1);
  });
  it("другая пунктуация, регистр, апострофы", () => {
    expect(copyCheck(RU.toUpperCase().replace(/,/g, " ;"), [RU]).copied).toBe(true);
    expect(copyCheck(UZ.replace(/ʻ/g, "'"), [UZ]).copied).toBe(true);
    expect(copyCheck(UZ.replace(/ʻ/g, "’").toUpperCase(), [UZ]).copied).toBe(true);
  });
  it("своими словами (ru, uz)", () => {
    expect(copyCheck("надо сделать одинаковый низ у обеих дробей, потом плюсуем верхушки", [RU]).copied).toBe(false);
    expect(copyCheck("avval ikkala kasrning pastini bir xil qilaman, keyin yuqorilarini qoʻshaman", [UZ]).copied).toBe(false);
  });
  it("учитываются только последние 6 реплик", () => {
    const filler = Array.from({ length: 6 }, (_, i) => `совсем другая реплика номер ${i} про яблоки`);
    expect(copyCheck(RU, [RU, ...filler]).copied).toBe(false); // 7-я с конца
    expect(copyCheck(RU, [RU, ...filler.slice(1)]).copied).toBe(true); // 6-я с конца
  });
  it("пустое безопасно", () => {
    expect(copyCheck("", [RU])).toEqual({ copied: false, score: 0 });
    expect(copyCheck(RU, [])).toEqual({ copied: false, score: 0 });
    expect(copyCheck("!!!", ["???"]).score).toBe(0);
  });
});
