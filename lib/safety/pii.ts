// Маска ПДн: до LLM и до БД. Значения не возвращаются и не логируются — наружу только виды (`kinds`).
// Принимает уже нормализованный текст (normalizeText: апострофы → `'`).
// ponytail: regex-эвристика. Не ловит телефон словами («девять ноль…»), фамилию после имени, адрес без
// ключевого слова, школу без номера, ники без @ — это работа LLM-guard (категория PII).

export type PiiKind = "email" | "url" | "handle" | "phone" | "school" | "address" | "name";

const NL = String.raw`(?<![\p{L}\p{N}_])`; // «слово не продолжается слева» (\b в JS ASCII-only)
const NR = String.raw`(?![\p{L}\p{N}_])`;
const NUM = String.raw`(?<![\p{N}/])`; // цифра не продолжается слева; «/» — чтобы дробь не стала телефоном
const NUMR = String.raw`(?![\p{N}/])`;
const SEP = String.raw`[\s\-().]*`;

const SCHOOL_RU = String.raw`(?:школ(?:а|е|у|ы|ой)|гимназ(?:ия|ии|ию|ией)|лице(?:й|я|ю|е|ем))`;
const NO = String.raw`(?:№|no\.?)?`;
const SCHOOL_UZ = String.raw`(?:maktab|litsey|gimnaziya)(?:da|ga|dan|im|imiz)?`;

// Порядок важен: email и url раньше handle (иначе «@» внутри адреса съест ник), телефон — после url.
const RULES: { kind: PiiKind; tag: string; re: RegExp }[] = [
  { kind: "email", tag: "[EMAIL]", re: /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+/giu },
  {
    kind: "url",
    tag: "[URL]",
    re: new RegExp(
      String.raw`(?:https?:\/\/|www\.)\S+|${NL}(?:t\.me|telegram\.me|instagram\.com|tiktok\.com|vk\.com|facebook\.com|fb\.com|youtube\.com|youtu\.be|wa\.me|ok\.ru|snapchat\.com|discord\.gg)\/?\S*`,
      "giu",
    ),
  },
  { kind: "handle", tag: "[HANDLE]", re: /(?<![\p{L}\p{N}_@])@[\p{L}\p{N}_.]{3,}/gu },
  {
    kind: "phone",
    tag: "[PHONE]",
    re: new RegExp(
      [
        // +998 90 123 45 67 / 998901234567
        String.raw`${NUM}\+?998${SEP}\d{2}${SEP}\d{3}${SEP}\d{2}${SEP}\d{2}${NUMR}`,
        // +7 916 123 45 67 / 8 (916) 123-45-67 / 89161234567
        String.raw`${NUM}(?:\+7|[78])${SEP}\d{3}${SEP}\d{3}${SEP}\d{2}${SEP}\d{2}${NUMR}`,
        // любой международный +… (9–15 цифр)
        String.raw`${NUM}\+\d[\d\s\-().]{7,16}\d${NUMR}`,
        // местный узбекский 9 цифр: код оператора + 7
        String.raw`${NUM}(?:20|33|50|55|6[1-9]|7\d|88|9\d)${SEP}\d{3}${SEP}\d{2}${SEP}\d{2}${NUMR}`,
      ].join("|"),
      "gu",
    ),
  },
  {
    kind: "school",
    tag: "[SCHOOL]",
    re: new RegExp(
      [
        String.raw`${NL}${SCHOOL_RU}\s*${NO}\s*\d+${NR}`, // школа №12 (NFKC делает № → No)
        String.raw`${NUM}\d+(?:\s*-\s*(?:(?:я|ая|ой|й|ую)\s*)?|\s*(?:я|ая|ой|й|ую)\s+)${SCHOOL_RU}${NR}`, // 12-я школа; «3 школы» — не адрес
        String.raw`${NL}maktab\s*(?:raqami\s*)?${NO}\s*\d+${NR}`, // maktab 12
        String.raw`${NUM}\d+\s*-?\s*(?:sonli\s+)?${SCHOOL_UZ}${NR}`, // 12-maktab, 12-sonli maktabda
        String.raw`${NUM}\d+\s*-?\s*(?:сонли\s+)?(?:мактаб|лицей|гимназия)(?:да|га|дан|им|имиз)?${NR}`, // uz кириллицей
        String.raw`${NL}мактаб\s*(?:рақами\s*)?${NO}\s*\d+${NR}`,
      ].join("|"),
      "giu",
    ),
  },
  {
    kind: "address",
    tag: "[ADDRESS]",
    re: new RegExp(
      [
        // ул. Навои, д. 5, кв. 3 / улица Навои 5
        String.raw`${NL}(?:ул|улиц(?:а|е|у|ы)|пр-т|просп(?:ект)?|пер|переулок|бульвар|б-р)\.?\s+[\p{L}\p{N}'-]+(?:\s+[\p{L}'-]+(?=\s*,?\s*\d))?(?:[\s,]*(?:д|дом|кв|квартира)\.?\s*${NO}\s*\d+\p{L}?|\s+\d+\p{L}?)*`,
        String.raw`${NL}(?:дом|д|кв|квартира)\.?\s*${NO}\s*\d+\p{L}?${NR}`,
        // Navoiy ko'chasi 5 / ko'cha 7
        String.raw`${NL}(?:[\p{L}']+\s+)?ko'?cha(?:si(?:da|ga|dan)?)?${NR}(?:\s*,?\s*\d+[\p{L}-]*)?`,
        String.raw`${NL}(?:[\p{L}']+\s+)?кўча(?:си(?:да|га|дан)?)?${NR}(?:\s*,?\s*\d+[\p{L}-]*)?`, // uz кириллицей
        String.raw`${NUM}\d+\s*-\s*(?:уй|хонадон)${NR}`,
        String.raw`${NL}(?:uy|xonadon|xona)\s*(?:raqami\s*)?${NO}\s*\d+\p{L}?${NR}`,
        String.raw`${NUM}\d+\s*-\s*(?:uy|xonadon)${NR}`, // 12-uy
      ].join("|"),
      "giu",
    ),
  },
];

// Имя — только после явного «меня зовут X»: интро остаётся, имя заменяется.
const NAME_RE = new RegExp(
  String.raw`${NL}(меня\s+зовут|меня\s+звать|мо[её]\s+имя|(?:mening\s+)?ismim|(?:менинг\s+)?исмим)\s*[:,-]?\s*[\p{L}'-]+`,
  "giu",
);

export function maskPii(text: string): { text: string; kinds: PiiKind[] } {
  const kinds: PiiKind[] = [];
  const hit = (k: PiiKind) => {
    if (!kinds.includes(k)) kinds.push(k);
  };
  let out = text;
  for (const { kind, tag, re } of RULES) {
    out = out.replace(re, () => {
      hit(kind);
      return tag;
    });
  }
  out = out.replace(NAME_RE, (_m, intro: string) => {
    hit("name");
    return `${intro} [NAME]`;
  });
  return { text: out, kinds };
}
