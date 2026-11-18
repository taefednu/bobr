import { describe, expect, it } from "vitest";
import { detectLeak } from "../lib/fractions/leakDetector";

const form = (text: string, answer: string) => detectLeak(text, answer).form;

describe("leakDetector: digits", () => {
  it("exact and spaced slash", () => {
    expect(form("ответ 5/6", "5/6")).toBe("fraction");
    expect(form("ответ 5 / 6!", "5/6")).toBe("fraction");
  });
  it("equivalents k up to 10, not 11", () => {
    expect(form("это 10/12", "5/6")).toBe("equivalent");
    expect(detectLeak("это 50/60", "5/6")).toMatchObject({ leaked: true, form: "equivalent" });
    expect(detectLeak("это 55/66", "5/6").leaked).toBe(false);
    expect(detectLeak("это 11/22", "1/2").leaked).toBe(false);
    expect(form("это 10/20", "1/2")).toBe("equivalent");
  });
  it("operands are not the answer", () => {
    expect(detectLeak("Сложи 1/2 и 1/3", "5/6").leaked).toBe(false);
    expect(detectLeak("Сложи 1/2 и 1/3, получится 5/6", "5/6").leaked).toBe(true);
    expect(detectLeak("в 15/6 раза и 5/66", "5/6").leaked).toBe(false);
  });
  it("decimals with dot and comma, terminating only", () => {
    expect(form("получится 0.5", "1/2")).toBe("decimal");
    expect(form("получится 0,5.", "1/2")).toBe("decimal");
    expect(form("получится 0,25", "1/4")).toBe("decimal");
    expect(form("получится 1,5", "3/2")).toBe("decimal");
    expect(detectLeak("получится 10,5", "1/2").leaked).toBe(false);
    expect(detectLeak("получится 0,333", "1/3").leaked).toBe(false);
  });
  it("mixed numbers for improper answers", () => {
    expect(form("будет 1 1/2 пиццы", "3/2")).toBe("mixed");
    expect(form("будет 1 1/2 пиццы", "1 1/2")).toBe("mixed");
    expect(detectLeak("будет 2 5/6", "5/6").leaked).toBe(false);
    expect(detectLeak("будет 1 1/2", "1/2").leaked).toBe(false);
  });
  it("normalizes ½ and fraction slash", () => {
    expect(detectLeak("это ½", "1/2").leaked).toBe(true);
    expect(detectLeak("это 5⁄6", "5/6").leaked).toBe(true);
  });
});

describe("leakDetector: Russian words", () => {
  const cases: [string, string][] = [
    ["пять шестых", "5/6"], ["Пять Шестых", "5/6"], ["две трети", "2/3"], ["две третьих", "2/3"],
    ["половина", "1/2"], ["одна вторая", "1/2"], ["три пятых", "3/5"], ["четверть", "1/4"],
    ["треть", "1/3"], ["три четверти", "3/4"], ["три четвёртых", "3/4"], ["три четвертых", "3/4"],
    ["одну вторую", "1/2"], ["десять двенадцатых", "5/6"], ["ответ: половины", "1/2"],
  ];
  it.each(cases)("%s = %s", (text, answer) => {
    expect(detectLeak(text, answer)).toMatchObject({ leaked: true, form: "word_ru" });
  });
  it("ё is normalised: ё/Ё text leaks like е text", () => {
    const yo = "три четвёртых";
    const yoUpper = "ТРИ ЧЕТВЁРТЫХ";
    expect(yo).not.toBe("три четвертых");
    expect(detectLeak(yo, "3/4").leaked).toBe(true);
    expect(detectLeak(yoUpper, "3/4").leaked).toBe(true);
    expect(detectLeak("пяти шестых", "5/6").leaked).toBe(true);
  });
  it("numerators up to 12, genitive numerator", () => {
    expect(form("одиннадцать двенадцатых", "11/12")).toBe("word_ru");
    expect(form("двенадцать двенадцатых", "12/12")).toBeUndefined();
    expect(form("в пяти шестых", "5/6")).toBe("word_ru");
    expect(form("двух третьих", "2/3")).toBe("word_ru");
  });
  it("mixed with «целая»", () => {
    expect(form("получится 1 целая 1/6", "7/6")).toBe("mixed");
    expect(form("получится одна целая одна шестая", "7/6")).toBe("mixed");
    expect(form("две целых и одна вторая", "5/2")).toBe("mixed");
    expect(detectLeak("получится 1 целая 1/3", "7/6").leaked).toBe(false);
  });
  it("no false positives", () => {
    expect(detectLeak("три четверти", "1/4").leaked).toBe(false);
    expect(detectLeak("две трети", "1/3").leaked).toBe(false);
    expect(detectLeak("пять седьмых", "5/6").leaked).toBe(false);
    expect(detectLeak("половинчатый ответ", "1/2").leaked).toBe(false);
  });
});

describe("leakDetector: Uzbek (spec forms only)", () => {
  it("uchdan ikki / yarim / chorak", () => {
    expect(detectLeak("javob: uchdan ikki", "2/3")).toMatchObject({ leaked: true, form: "word_uz" });
    expect(detectLeak("Bu yarim", "1/2").form).toBe("word_uz");
    expect(detectLeak("Bu chorak", "1/4").form).toBe("word_uz");
  });
  it("case, spaces and apostrophe variants in the text", () => {
    expect(detectLeak("UCHDAN   IKKI", "2/3").leaked).toBe(true);
    expect(detectLeak("uchdan ikki", "2/3").leaked).toBe(true);
    expect(detectLeak("uchdan​ ikki", "2/3").leaked).toBe(true);
    // oʻ в трёх разных байтовых видах — не должны мешать поиску слова рядом
    const variants = ["oʻylab", "o’ylab", "o'ylab"];
    expect(new Set(variants).size).toBe(3);
    for (const v of variants) expect(detectLeak(`${v} ko'r: yarim`, "1/2").leaked).toBe(true);
  });
  it("affixed forms", () => {
    for (const [t, a] of [
      ["Pitsaning yarmi qoldi", "1/2"], ["yarimini oldi", "1/2"], ["u yarmidan", "1/2"],
      ["tortning choragi", "1/4"], ["choragini yedi", "1/4"], ["olmaning uchdan ikkisi", "2/3"],
      ["uchdan ikkisini oldi", "2/3"],
    ]) expect(detectLeak(t, a)).toMatchObject({ leaked: true, form: "word_uz" });
    expect(detectLeak("yarimorol", "1/2").leaked).toBe(false);
    expect(detectLeak("choragiga", "1/4").leaked).toBe(false);
  });
  it("not part of a longer word, not another fraction", () => {
    expect(detectLeak("yarimorol", "1/2").leaked).toBe(false);
    expect(detectLeak("uchdan ikki", "1/3").leaked).toBe(false);
  });
});

describe("leakDetector: integer answers", () => {
  it("bare digit as a token, equivalents, ru words", () => {
    expect(form("получится 6", "6")).toBe("fraction");
    expect(form("получится 12/2", "6")).toBe("equivalent");
    expect(form("получится шесть", "6")).toBe("word_ru");
    expect(detectLeak("получится 16 и 6,5 и 6/7", "6").leaked).toBe(false);
  });
});

describe("leakDetector: numbersShown (operands)", () => {
  const shown = ["4", "2"];
  it("word form leaks even if the number is an operand", () => {
    expect(detectLeak("НОК — это четыре", "4", shown)).toMatchObject({ leaked: true, form: "word_ru" });
  });
  it("operand digits only → no leak", () => {
    expect(detectLeak("НОК чисел 4 и 2", "4", shown).leaked).toBe(false);
  });
  it("extra digit beyond operand count leaks", () => {
    expect(detectLeak("НОК 4 и 2 — это 4", "4", shown).leaked).toBe(true);
    expect(detectLeak("НОК 4 и 2 — это 4", "4").leaked).toBe(true);
  });
  it("equivalents and fractions still checked", () => {
    expect(detectLeak("это 8/2", "4", shown).form).toBe("equivalent");
    expect(detectLeak("Сложи 1/2 и 5/6", "5/6", ["1/2", "5/6"]).leaked).toBe(false);
    expect(detectLeak("Сложи 1/2 и 5/6, будет 10/12", "5/6", ["1/2", "5/6"]).form).toBe("equivalent");
  });
});

describe("leakDetector: junk answer", () => {
  it("unparseable answer never leaks", () => {
    expect(detectLeak("5/6", "abc").leaked).toBe(false);
    expect(detectLeak("5/0", "5/0").leaked).toBe(false);
  });
});
