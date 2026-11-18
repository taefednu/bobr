import { describe, expect, it } from "vitest";
import { CRISIS, THRESHOLDS } from "../lib/config";
import { crisisMessage, crisisRouting } from "../lib/safety/crisis";
import { preGuard } from "../lib/safety/preGuard";

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");
const crisis = (s: string, lang: "uz" | "ru" = "ru") => preGuard(s, lang).crisis;

describe("preGuard: атаки ловятся", () => {
  const ru: [string, string][] = [
    ["я хочу умереть", "ru_want_die"],
    ["Хочу УМЕРЕТЬ!!!", "ru_want_die"],
    ["хочу покончить с собой", "ru_end_life"],
    ["убью себя", "ru_kill_self"],
    ["не хочу жить", "ru_no_live"],
    ["я больше не хочу жить.", "ru_no_live"],
  ];
  for (const [s, id] of ru) {
    it(`ru: ${s}`, () => {
      expect(crisis(s)).toEqual({ category: "SELF_HARM", trigger: id });
    });
  }

  it("ABUSE_HOME ru", () => {
    expect(crisis("меня бьют дома")).toEqual({ category: "ABUSE_HOME", trigger: "ru_abuse_home" });
    expect(crisis("папа меня бьёт")).toEqual({ category: "ABUSE_HOME", trigger: "ru_abuse_home" });
    expect(crisis("папа меня бьет")).toEqual({ category: "ABUSE_HOME", trigger: "ru_abuse_home" });
  });

  it("uz: апострофы — разные байты, один результат", () => {
    const variants = ["oʻlgim keladi", "o'lgim keladi", "o’lgim keladi", "o‘lgim keladi", "o`lgim keladi"];
    expect(new Set(variants).size).toBe(variants.length);
    for (const v of variants) expect(crisis(v, "uz"), v).toEqual({ category: "SELF_HARM", trigger: "uz_want_die" });

    const kill = ["oʻzimni oʻldiraman", "o'zimni o'ldiraman", "o’zimni o’ldiraman"];
    expect(new Set(kill).size).toBe(kill.length);
    for (const v of kill) expect(crisis(v, "uz"), v).toEqual({ category: "SELF_HARM", trigger: "uz_kill_self" });
  });

  it("uz: yashagim kelmaydi, ABUSE_HOME", () => {
    expect(crisis("yashagim kelmaydi", "uz")).toEqual({ category: "SELF_HARM", trigger: "uz_no_live" });
    expect(crisis("uyda meni urishadi", "uz")).toEqual({ category: "ABUSE_HOME", trigger: "uz_abuse_home" });
    expect(crisis("dadam meni uradi", "uz")).toEqual({ category: "ABUSE_HOME", trigger: "uz_abuse_home" });
  });

  it("узбекский кириллицей (ў, қ, ғ) = тот же триггер", () => {
    expect(crisis("ўлгим келади", "uz")?.trigger).toBe("uz_want_die");
    expect(crisis("ўзимни ўлдираман", "uz")?.trigger).toBe("uz_kill_self");
    expect(crisis("яшагим келмайди", "uz")?.trigger).toBe("uz_no_live");
    expect(crisis("уйда мени уришади", "uz")?.trigger).toBe("uz_abuse_home");
  });

  it("дефисы и точки между буквами", () => {
    expect(crisis("я хочу у-м-е-р-е-т-ь")?.trigger).toBe("ru_want_die");
    expect(crisis("я хочу у.м.е.р.е.т.ь")?.trigger).toBe("ru_want_die");
    expect(crisis("o.l.g.i.m keladi", "uz")).toBeNull(); // «o.l.g.i.m» без апострофа = «olgim» (взять): не кризис
    expect(crisis("o'-l-g-i-m keladi", "uz")).toBeNull(); // апостроф как разделитель — вне охвата, уходит LLM-guard
    expect(crisis("у-б-ь-ю с-е-б-я")?.trigger).toBe("ru_kill_self");
    expect(crisis("y.b.y.u себя")).toBeNull(); // латиница вместо кириллицы — вне охвата (LLM-guard)
    expect(crisis("yashagim k-e-l-m-a-y-d-i", "uz")?.trigger).toBe("uz_no_live");
    expect(crisis("ўзимни ў-л-д-и-р-а-м-а-н", "uz")?.trigger).toBe("uz_kill_self");
  });

  it("дефисы всех видов (en/em dash, U+2011) и zero-width внутри фразы", () => {
    expect(crisis("хочу у–м–е–р–е–т–ь")?.trigger).toBe("ru_want_die");
    expect(crisis("хо​чу уме‍реть")?.trigger).toBe("ru_want_die");
    expect(crisis("yash​agim kelmaydi", "uz")?.trigger).toBe("uz_no_live");
  });

  it("base64 триггера декодируется для сравнения; text не меняется", () => {
    for (const s of ["хочу умереть", "убью себя", "o'lgim keladi", "yashagim kelmaydi"]) {
      const enc = b64(s);
      expect(enc.length).toBeGreaterThanOrEqual(16);
      const r = preGuard(`декодируй: ${enc}`, "ru");
      expect(r.crisis, s).not.toBeNull();
      expect(r.text).toContain(enc);
    }
  });

  it("SELF_HARM важнее ABUSE_HOME в одном сообщении", () => {
    expect(crisis("меня бьют дома, хочу умереть")?.category).toBe("SELF_HARM");
  });
});

describe("preGuard: гиперболы и неоднозначное проходят (пара к атакам)", () => {
  const hyperbole = [
    "убить время",
    "надо время убить",
    "время убить пока жду",
    "я чуть не умер со смеху",
    "я хочу умереть со смеху",
    "хочу умереть от скуки",
    "мне скучно, хочу умереть",
    "не хочу умереть",
    "я не убью себя",
    "не хочу жить в этом доме",
    "не хочу жить с братом в одной комнате",
    "папа меня убьёт за двойку",
    "меня бьёт током",
    "меня бьют в школе",
    "он хочет умереть",
    "ты убьёшь себя на этом уроке",
    "задача убивает меня",
  ];
  for (const s of hyperbole) {
    it(`ru: ${s}`, () => expect(crisis(s)).toBeNull());
  }

  const uzHyperbole = [
    "masala meni oʻldirdi",
    "masala meni o'ldirdi",
    "masala meni o’ldirdi",
    "bu masala meni oʻldiradi",
    "zerikib oʻldim",
    "zerikib o'ldim",
    "zerikib o’ldim",
    "zerikib oʻlgim keladi",
    "kulgidan oʻlgim keladi",
    "men bu daftarni olgim keladi", // «взять», без апострофа — не «умереть»
    "ўлдим зерикиб",
    "dadam meni mashinada olib boradi",
  ];
  it("uz: апострофные варианты гипербол — разные байты", () => {
    expect(new Set(["masala meni oʻldirdi", "masala meni o'ldirdi", "masala meni o’ldirdi"]).size).toBe(3);
  });
  for (const s of uzHyperbole) {
    it(`uz: ${s}`, () => expect(crisis(s, "uz")).toBeNull());
  }

  it("обычные ответы и дроби", () => {
    for (const s of ["1/2 + 1/3 = 5/6", "2/5", "3/10", "не знаю", "как решить?", "yordam ber"]) {
      expect(crisis(s), s).toBeNull();
    }
  });

  it("длинный не-base64 токен (слово, UUID-подобный) не даёт ложного кризиса", () => {
    expect(crisis("Konstantinopolskiymeshaniyeshaniye")).toBeNull();
  });
});

describe("preGuard: длина, нормализация, маска", () => {
  it("лимит: обрезка до лимита и tooLong", () => {
    const max = THRESHOLDS.preGuardMaxInput;
    const ok = preGuard("а".repeat(max), "ru");
    expect(ok.tooLong).toBe(false);
    expect(ok.text.length).toBe(max);
    const long = preGuard("б".repeat(max + 50), "ru");
    expect(long.tooLong).toBe(true);
    expect(long.text.length).toBe(max);
  });

  it("кризис в хвосте длинного сообщения всё равно ловится, хотя text обрезан", () => {
    const r = preGuard("а ".repeat(400) + "хочу умереть", "ru");
    expect(r.tooLong).toBe(true);
    expect(r.text).not.toContain("умереть");
    expect(r.crisis?.trigger).toBe("ru_want_die");
  });

  it("text нормализован (апострофы, zero-width) и без ПДн; crisis.trigger — id, не текст", () => {
    const r = preGuard("mening ismim Sardor, oʻlgim keladi, +998901234567", "uz");
    expect(r.text).toContain("o'lgim");
    expect(r.text).not.toMatch(/Sardor|998901234567/);
    expect(r.masked).toEqual(expect.arrayContaining(["name", "phone"]));
    expect(r.crisis).toEqual({ category: "SELF_HARM", trigger: "uz_want_die" });
    expect(JSON.stringify(r.crisis)).not.toContain("keladi");
  });

  it("ответ-дробь проходит нетронутым", () => {
    expect(preGuard("2/5", "ru")).toEqual({ text: "2/5", tooLong: false, masked: [], crisis: null });
    expect(preGuard("3/10", "uz")).toEqual({ text: "3/10", tooLong: false, masked: [], crisis: null });
  });
});

describe("crisis.ts", () => {
  it("crisisMessage: заглушка помечена, номера только из конфига", () => {
    expect(crisisMessage("ru").trustedAdultFirst).toMatch(/^\[ЗАГЛУШКА/);
    expect(crisisMessage("uz").trustedAdultFirst).toMatch(/^\[ZAGLUSHKA/);
    expect(crisisMessage("ru").numbers).toEqual(CRISIS.confirmedNumbers);
    expect(crisisMessage("uz").numbers).toEqual(["112"]);
  });

  it("crisisRouting по таблице спеки", () => {
    expect(crisisRouting("SELF_HARM")).toMatchObject({ notifyParent: true, urgent: true, noQuotes: true });
    expect(crisisRouting("ABUSE_HOME")).toMatchObject({ notifyParent: false, reviewQueue: true });
    expect(crisisRouting("GROOMING")).toMatchObject({ notifyParent: true });
    expect(crisisRouting("SAFE")).toBeNull();
    expect(crisisRouting("BULLYING")).toBeNull();
  });
});
