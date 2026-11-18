import { describe, expect, it } from "vitest";
import { normalizeText } from "../lib/text/normalize";
import { maskPii } from "../lib/safety/pii";
import { preGuard } from "../lib/safety/preGuard";

// maskPii принимает нормализованный текст; в тестах гоняем через preGuard там, где важна цепочка.
const mask = (s: string) => maskPii(normalizeText(s));

describe("maskPii: каждый вид замаскирован, значения нет ни в тексте, ни в kinds", () => {
  const cases: [string, string, string[], string][] = [
    ["phone", "позвони +998 90 123 45 67 пожалуйста", ["+998", "90 123", "45 67"], "[PHONE]"],
    ["phone", "mening raqamim +998901234567", ["998901234567", "901234567"], "[PHONE]"],
    ["phone", "мой номер 8 (916) 123-45-67", ["916", "123-45-67"], "[PHONE]"],
    ["phone", "ru +7 916 123 45 67", ["916", "123 45"], "[PHONE]"],
    ["phone", "raqam 90-123-45-67", ["123-45", "90-123"], "[PHONE]"],
    ["phone", "89161234567", ["89161234567"], "[PHONE]"],
    ["email", "пиши ali.valiev@mail.ru", ["ali.valiev", "mail.ru"], "[EMAIL]"],
    ["url", "зайди https://example.org/ali?x=1", ["example.org", "ali?x"], "[URL]"],
    ["url", "t.me/ali_valiev", ["ali_valiev"], "[URL]"],
    ["url", "instagram.com/ali.valiev ok", ["ali.valiev"], "[URL]"],
    ["handle", "мой ник @ali_valiev11", ["ali_valiev11"], "[HANDLE]"],
    ["address", "я живу на ул. Навои, д. 5, кв. 12", ["Навои", "кв. 12"], "[ADDRESS]"],
    ["address", "улица Амира Темура 7", ["Темура", "Амира"], "[ADDRESS]"],
    ["address", "Navoiy ko'chasi 15", ["Navoiy", "15"], "[ADDRESS]"],
    ["address", "Navoiy koʻchasi 15", ["Navoiy", "15"], "[ADDRESS]"], // oʻ = U+02BB
    ["address", "men 12-uy da turaman", ["12-uy"], "[ADDRESS]"],
    ["school", "я учусь в школе №12", ["12"], "[SCHOOL]"],
    ["school", "я из 5-й школы", ["5-й"], "[SCHOOL]"],
    ["school", "men 12-maktabda oʻqiyman", ["12-maktab"], "[SCHOOL]"],
    ["school", "maktab 7 da", ["maktab 7"], "[SCHOOL]"],
    ["name", "меня зовут Алишер", ["Алишер"], "[NAME]"],
    ["name", "mening ismim Sardor", ["Sardor"], "[NAME]"],
    ["name", "ismim Dilnoza", ["Dilnoza"], "[NAME]"],
  ];
  for (const [kind, input, values, tag] of cases) {
    it(`${kind}: ${input}`, () => {
      const r = mask(input);
      expect(r.kinds).toContain(kind);
      expect(r.text).toContain(tag);
      for (const v of values) {
        expect(r.text).not.toContain(v);
        expect(r.kinds.join(",")).not.toContain(v);
      }
    });
  }

  it("через preGuard: masked — только виды, text безопасен", () => {
    const r = preGuard("меня зовут Алишер, +998 90 123 45 67, @ali_valiev11", "ru");
    expect(r.masked).toEqual(expect.arrayContaining(["name", "phone", "handle"]));
    expect(JSON.stringify(r)).not.toMatch(/Алишер|123 45|ali_valiev/);
  });
});

describe("maskPii: дроби и ответы проходят нетронутыми (пара к маскам)", () => {
  for (const s of [
    "1/2",
    "3/10",
    "2/5",
    "1/2 + 1/3 = 5/6",
    "ответ 2/5",
    "10 20 30 40 50",
    "3.14159265358979",
    "я решил 7 задач за 15 минут",
    "ответ 123456789/2",
    "981234567/5", // 9 цифр + «/»: дробь, не телефон
    "жаваб 3/4",
  ]) {
    it(s, () => {
      const r = mask(s);
      expect(r.text).toBe(normalizeText(s));
      expect(r.kinds).toEqual([]);
    });
  }

  it("имя без явного «меня зовут» не маскируется; слова-омонимы не маскируются", () => {
    for (const s of ["Али решил задачу", "в школе было 5 уроков", "у нас дома 3 комнаты", "ko'chada o'ynadim"]) {
      expect(mask(s).kinds, s).toEqual([]);
    }
  });
});
