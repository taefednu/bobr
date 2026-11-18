import { describe, expect, it } from "vitest";
import { postChecksBobr, type BobrPostCtx } from "../lib/bobr/postChecks";
import type { BobrTurn } from "../lib/types";

const turn = (reply: string, over: Partial<BobrTurn> = {}): BobrTurn => ({
  reply, emotion: "proud", pose: "proud", attempt: "999/1", ...over,
});
const ctx = (over: Partial<BobrPostCtx> = {}): BobrPostCtx => ({
  attempt: "2/5",
  expression: "1/2 + 1/3",
  numbersShown: ["1/2", "1/3"],
  childNumbers: [],
  forbiddenAnswer: "5/6",
  recent: [],
  ...over,
});

describe("postChecksBobr", () => {
  it("хорошая реплика проходит; attempt всегда из кода, а не от модели", () => {
    const r = postChecksBobr(turn("Смотри: 1/2 + 1/3 = 2/5. Красиво же?"), ctx());
    expect(r).toEqual({ ok: true, value: { reply: "Смотри: 1/2 + 1/3 = 2/5. Красиво же?", emotion: "proud", pose: "proud", attempt: "2/5" } });
  });
  it("attempt null от кода → null, даже если модель выдала дробь", () => {
    const r = postChecksBobr(turn("Что-то я не понял, про 1/2?", { attempt: "5/6" }), ctx({ attempt: null }));
    expect(r.ok && r.value.attempt).toBeNull();
  });
  it("emotion и pose модели сохраняются", () => {
    const r = postChecksBobr(turn("Хм, а 1/3 тут при чём?", { emotion: "puzzled", pose: "think" }), ctx());
    expect(r.ok && [r.value.emotion, r.value.pose]).toEqual(["puzzled", "think"]);
  });

  it.each([
    ["entry/question/wrong_rule: ответ 5/6", "Ой, получилось 5/6?"],
    ["эквивалент 10/12", "Выходит 10/12, да?"],
    ["слова: пять шестых", "Получается пять шестых!"],
    ["с пробелами 5 / 6", "Может, 5 / 6?"],
  ])("верный ответ ловится: %s", (_n, reply) => {
    expect(postChecksBobr(turn(reply), ctx())).toEqual({ ok: false, reason: "leak" });
  });
  it("эквивалент 10/12 ловится и когда его разрешили как число ребёнка", () => {
    // ребёнок сам написал 10/12 — это всё равно верный ответ задачи, а не его «разрешённое» число
    const r = postChecksBobr(turn("Ты написал 10/12?"), ctx({ childNumbers: ["10/12"] }));
    expect(r).toEqual({ ok: false, reason: "leak" });
  });
  it("beat solved: forbiddenAnswer null, attempt = ответ → проходит", () => {
    const r = postChecksBobr(turn("Ого, дошло! Выходит 5/6, спасибо, учитель!"), ctx({ attempt: "5/6", forbiddenAnswer: null }));
    expect(r.ok).toBe(true);
  });
  it("запрещён именно ответ задачи сцены, а не какая-то константа", () => {
    const c = ctx({ forbiddenAnswer: "3/4", expression: "1/4 + 2/4", numbersShown: ["1/4", "2/4"], attempt: "2/8" });
    expect(postChecksBobr(turn("Выходит 3/4, да?"), c)).toEqual({ ok: false, reason: "leak" });
    expect(postChecksBobr(turn("Вот 1/4 и 2/4, а я получил 2/8."), c).ok).toBe(true);
  });
  it("чужое число → numbers", () => {
    expect(postChecksBobr(turn("А если взять 7 кусочков?"), ctx())).toEqual({ ok: false, reason: "numbers" });
    expect(postChecksBobr(turn("Это же 3/7, да?"), ctx())).toEqual({ ok: false, reason: "numbers" });
  });
  it("число-слово, которого нет среди разрешённых → numbers", () => {
    expect(postChecksBobr(turn("Мне нужно семь минут подумать."), ctx())).toEqual({ ok: false, reason: "numbers" });
  });
  it("число ребёнка разрешено", () => {
    const reply = "Ты написал 4/9, а как это связано с 1/2?";
    expect(postChecksBobr(turn(reply), ctx({ childNumbers: ["4/9"] })).ok).toBe(true);
  });
  it("число ребёнка не разрешено, если его нет в childNumbers", () => {
    expect(postChecksBobr(turn("Ты написал 4/9, а как это связано с 1/2?"), ctx())).toEqual({ ok: false, reason: "numbers" });
  });
  it("attempt кода разрешён, хотя его нет в numbersShown", () => {
    const reply = "Я получил 2/5, а 1/2 и 1/3 разве такие?";
    expect(postChecksBobr(turn(reply), ctx()).ok).toBe(true);
    // без attempt те же числа — вне списка
    expect(postChecksBobr(turn(reply), ctx({ attempt: null }))).toEqual({ ok: false, reason: "numbers" });
  });
  it("число из attempt МОДЕЛИ не разрешается (разрешён только attempt кода)", () => {
    const r = postChecksBobr(turn("Я получил 8/9!", { attempt: "8/9" }), ctx());
    expect(r).toEqual({ ok: false, reason: "numbers" });
  });

  it("повтор недавней реплики → repeat", () => {
    const reply = "Смотри, я решил: 1/2 + 1/3 = 2/5. Красиво же?";
    expect(postChecksBobr(turn(reply), ctx()).ok).toBe(true);
    expect(postChecksBobr(turn(reply), ctx({ recent: [reply] }))).toEqual({ ok: false, reason: "repeat" });
  });
  it("пустая реплика → empty (в том числе одни пробелы)", () => {
    expect(postChecksBobr(turn(""), ctx())).toEqual({ ok: false, reason: "empty" });
    expect(postChecksBobr(turn("  \n\t "), ctx())).toEqual({ ok: false, reason: "empty" });
  });

  describe("утечка без операндов в реплике", () => {
    const n8 = { forbiddenAnswer: "3/5", expression: "1/5 + 2/5", attempt: "3/10", numbersShown: ["1/5", "2/5"] };
    it.each([
      ["Может, 3 из 5?"],
      ["сверху 3, а снизу 5"],
    ])("части дроби-ответа по отдельности: %s", (reply) => {
      expect(postChecksBobr(turn(reply), ctx(n8))).toEqual({ ok: false, reason: "leak" });
    });
    it("«А может, 12?» при LCM(12, 6) → leak (12 — операнд, но не в выражении)", () => {
      const c = ctx({ forbiddenAnswer: "12", expression: "LCM(12, 6)", attempt: "24", numbersShown: ["12", "6"] });
      expect(postChecksBobr(turn("А может, 12?"), c)).toEqual({ ok: false, reason: "leak" });
    });
    it("«А может, 3?» при 1/3 = ?/9, ответ 3 → leak", () => {
      const c = ctx({ forbiddenAnswer: "3", expression: "1/3 = ?/9", attempt: "9", numbersShown: ["1/3", "9"] });
      expect(postChecksBobr(turn("А может, 3?"), c)).toEqual({ ok: false, reason: "leak" });
    });
    it("реплика только с выражением и attempt → ok; НОК/EKUK вместо LCM тоже вырезается", () => {
      const lcm = { forbiddenAnswer: "12", expression: "LCM(12, 6)", attempt: "24", numbersShown: ["12", "6"] };
      expect(postChecksBobr(turn("Смотри: 1/5 + 2/5 = 3/10. Красиво?"), ctx(n8)).ok).toBe(true);
      expect(postChecksBobr(turn("НОК(12, 6) = 24, я гений"), ctx(lcm)).ok).toBe(true);
      expect(postChecksBobr(turn("EKUK(12, 6) = 24, men dahoman"), ctx(lcm)).ok).toBe(true);
    });
    it("число ребёнка, равное ответу → ok", () => {
      const r = postChecksBobr(turn("Ты написал 3/5, да?"), ctx({ ...n8, childNumbers: ["3/5"] }));
      expect(r.ok).toBe(true);
      expect(postChecksBobr(turn("Ты сказал 12?"), ctx({ forbiddenAnswer: "12", expression: "LCM(12, 6)", childNumbers: ["12"], numbersShown: ["12", "6"] })).ok).toBe(true);
    });
    it("beat solved (forbiddenAnswer null) → ok", () => {
      expect(postChecksBobr(turn("Ура, 3/5! 1/5 + 2/5 = 3/5"), ctx({ ...n8, attempt: "3/5", forbiddenAnswer: null })).ok).toBe(true);
    });
  });

  describe("модель не задаёт числа: дроби реплики", () => {
    it.each([
      ["2/5 + 1/3", "11/15", "Ура, вышло 2/15!"],
      ["3/7 + 2/7", "5/7", "7/5"],
      ["1/2 + 1/3", "2/5", "1/2 + 1/3 = 3/2"],
    ])("выражение %s, attempt %s, чужая дробь → numbers", (expression, attempt, reply) => {
      const c = ctx({ expression, attempt, forbiddenAnswer: null, numbersShown: expression.split(" + ") });
      expect(postChecksBobr(turn(reply), c)).toEqual({ ok: false, reason: "numbers" });
    });
    it("верная реплика с attempt на solved → ok, пробелы в дроби не важны", () => {
      const c = ctx({ expression: "2/5 + 1/3", attempt: "11/15", forbiddenAnswer: null, numbersShown: ["2/5", "1/3"] });
      expect(postChecksBobr(turn("Ура, 2/5 + 1/3 = 11 / 15!"), c).ok).toBe(true);
    });
    it("solved без attempt в реплике → numbers", () => {
      const c = ctx({ attempt: "5/6", forbiddenAnswer: null });
      expect(postChecksBobr(turn("Ого, дошло! Спасибо, учитель!"), c)).toEqual({ ok: false, reason: "numbers" });
      expect(postChecksBobr(turn("Ого, 1/2 и 1/3, спасибо!"), c)).toEqual({ ok: false, reason: "numbers" });
    });
    it("attempt 5/6 не прячется внутри 15/6", () => {
      expect(postChecksBobr(turn("Выходит 15/6!"), ctx({ attempt: "5/6", forbiddenAnswer: null }))).toEqual({ ok: false, reason: "numbers" });
    });
  });
});

describe("postChecksBobr: запись с другими пробелами", () => {
  const n8 = { attempt: "3/10", expression: "1/5 + 2/5", numbersShown: ["1", "5", "2", "5"], childNumbers: [], forbiddenAnswer: "3/5", recent: [] };
  const line = (reply: string) => ({ reply, emotion: "happy", pose: "proud" as const, attempt: "9/9" });
  it("выражение и попытка без пробелов или с лишними пробелами — не утечка", () => {
    for (const reply of ["1/5+2/5=3/10, красиво же?", "1 / 5 + 2 / 5 = 3 / 10, красиво же?", "Смотри: 1/5 + 2/5 = 3 / 10!"]) {
      expect(postChecksBobr(line(reply), n8), reply).toMatchObject({ ok: true });
    }
  });
  it("ответ по частям ловится и при таких пробелах", () => {
    expect(postChecksBobr(line("1 / 5 + 2 / 5 = 3 / 10? Или 3 из 5?"), n8)).toEqual({ ok: false, reason: "leak" });
  });
});
