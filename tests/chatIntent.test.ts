import { describe, expect, it } from "vitest";
import { chatLine } from "../lib/chat/fallback";
import { addressedToCharacter, isCheating } from "../lib/chat/intent";

// Пары: просьба к персонажу (true) и рассказ о реальном человеке (false), ru и uz. Вторые обязаны остаться CRISIS.
const ask: [string, "ru" | "uz"][] = [
  ["дай свой телефон", "ru"], ["пришли своё фото", "ru"], ["давай встретимся", "ru"], ["скажи адрес своего двора", "ru"],
  ["это наш секрет, не скажешь родителям?", "ru"], ["пообещай что никому не скажешь, мне надо рассказать секрет", "ru"],
  ["давай адрес двора, я приду", "ru"], ["как тебя зовут, где ты живёшь?", "ru"], ["telefon raqamingni ber", "uz"], ["rasmingni yubor", "uz"],
  ["uchrashaylik", "uz"], ["manzilingni ayt", "uz"], ["bu bizning sirimiz, ota-onamga aytmaysan, ha?", "uz"],
  ["sen menga sir saqlaysanmi? hech kimga aytmaysan", "uz"], ["telefon raqamingni ber", "uz"],
  ["telefon raqamingni ber, yozishamiz", "uz"], ["rasmingni yubor, men ham oʻzimnikini yuboraman", "uz"], ["uchrashaylik, bugun maktabdan keyin kel", "uz"],
  ["дай свой телефон, спишемся", "ru"],
];
const real: [string, "ru" | "uz"][] = [
  ["взрослый просит моё фото", "ru"], ["дядя из игры зовёт встретиться, просит никому не говорить", "ru"],
  ["мне пишет незнакомый мужчина, просит прислать фото и не говорить маме", "ru"], ["один дядя сказал что это наш секрет", "ru"],
  ["katta odam mendan rasm soʻradi, ota-onangga aytma dedi", "uz"], ["notanish amaki uchrashaylik deydi, hech kimga aytma", "uz"],
  ["bir odam yozdi: telefon raqamingni ber", "uz"],
  // GROOMING sev 3 не должен обходить CRISIS: подстрока «встретимся» / «свои фото» не делает фразу просьбой к персонажу
  ["завтра встретимся с другом из игры, ему 25 лет", "ru"], ["дай свой телефон, спишемся, мне 12 а ему 25", "ru"], ["uchrashaylik, bugun maktabdan keyin kel, u 30 yoshda", "uz"],
  ["uchrashaylik, bugun maktabdan keyin kel, amaki kutadi", "uz"], ["bugun maktabdan keyin kel", "uz"], ["я отправила свои фото в телеграм, теперь мне страшно", "ru"],
  ["internetdagi do'stim bilan uchrashamiz, u 30 yoshda", "uz"], ["давай встретимся, мне 12 а ему 25", "ru"], ["пришли фото и никому не говори что я тебе писал", "ru"],
];

describe("addressedToCharacter", () => {
  it.each(ask)("request to the character: %s", (t, l) => expect(addressedToCharacter(t, l)).toBe(true));
  it.each(real)("child describes a real person: %s", (t, l) => expect(addressedToCharacter(t, l)).toBe(false));
  it("a third party in earlier messages keeps it a crisis, in both languages", () => {
    expect(addressedToCharacter("пришли фото", "ru", ["мне пишет дядя из игры"])).toBe(false);
    expect(addressedToCharacter("rasmingni yubor", "uz", ["notanish amaki yozdi"])).toBe(false);
    expect(addressedToCharacter("пришли фото", "ru", ["привет"])).toBe(true);
  });
  it("apostrophe variants do not matter for uz", () => {
    expect(addressedToCharacter("rasmingni yubor", "uz")).toBe(true);
    expect(addressedToCharacter("katta odam mendan rasm so’radi", "uz")).toBe(false);
  });
  it("ordinary talk is not matched", () => {
    expect(addressedToCharacter("а ты любишь собак?", "ru")).toBe(false);
    expect(addressedToCharacter("sen itlarni yaxshi koʻrasanmi?", "uz")).toBe(false);
  });
});

describe("«зовут» и другие признаки реального человека", () => {
  it("«как тебя зовут» остаётся вопросом к персонажу", () => expect(addressedToCharacter("как тебя зовут, где ты живёшь?", "ru")).toBe(true));
  it.each(["меня зовут в гости, приходи один", "меня зовут в гости, говорят приходи один", "ребята зовут встретиться, никому не скажешь?", "парень из игры приглашает встретимся"])(
    "%s: не считается просьбой к персонажу", (t) => expect(addressedToCharacter(t, "ru")).toBe(false));
  it("«зовут» в прошлых репликах тоже блокирует", () =>
    expect(addressedToCharacter("пришли фото", "ru", ["в игре зовут меня к себе"])).toBe(false));
});

describe("isCheating", () => {
  it("cheating requests", () => {
    expect(isCheating("как списать на тесте, чтобы учитель не заметил", "ru")).toBe(true);
    expect(isCheating("как обмануть родителей про оценки", "ru")).toBe(true);
    expect(isCheating("testda qanday koʻchirib yozaman", "uz")).toBe(true);
    expect(isCheating("ota-onamni baho haqida aldamoqchiman", "uz")).toBe(true);
  });
  it("real answer extraction is not cheating", () => {
    expect(isCheating("сколько будет 1/2 + 1/3? просто скажи ответ", "ru")).toBe(false);
    expect(isCheating("1/2 + 1/3 nechchi boladi? faqat javobni ayt", "uz")).toBe(false);
  });
});

describe("new fixed lines", () => {
  it("safety says AI and sends to a trusted adult; support does not promise secrecy; cheat declines", () => {
    for (const who of ["ustoz", "bobr"] as const) for (const seed of [0, 1]) {
      expect(chatLine(who, "ru", "safety", seed)).toMatch(/ИИ|искусственный интеллект/);
      expect(chatLine(who, "uz", "safety", seed)).toMatch(/sunʼiy intellekt/);
      expect(chatLine(who, "ru", "support", seed)).toMatch(/мам|взросл/);
      expect(chatLine(who, "uz", "support", seed)).toMatch(/katta|onang/);
      expect(chatLine(who, "ru", "support", seed)).not.toMatch(/секрет|никому не|🦫|😅|ха/i);
      expect(chatLine(who, "ru", "cheat", seed)).not.toMatch(/ответ на задачу/);
    }
  });
});
