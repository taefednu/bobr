// Детерминированные узкие распознаватели для болталки (ru + uz). Не решают про безопасность ребёнка сами:
// только сообщают конвейеру, что просьба адресована персонажу или что речь про списывание.
// Ошибка в сторону «не распознал» = как раньше (CRISIS). Любое упоминание третьего лица ломает совпадение: ребёнок описывает реального человека.
import { normalizeForMatch } from "../text/normalize";

type Lang = "uz" | "ru";

// \b в JS видит только ASCII: для кириллицы границы слова задаём через \p{L}.
const cyr = (re: RegExp) => new RegExp(re.source.replace(/\\b\(/g, "(?<!\\p{L})(").replace(/\)\\b/g, ")(?!\\p{L})"), "u");

// Третье лицо / реальный человек. Строки нормализованы (ё→е, апострофы → ').
const THIRD_PARTY: Record<Lang, RegExp> = {
  ru: cyr(/дядя|дядь|взросл|незнаком|чужо|мужчин|кто-то|кто то|\b(он|она|они)\b|просит|просят|пишет|пишут|зовет|зовут|звонит|предлагает|требует|заставляет|угрожает|говорит мне|сказал|написал|попросил|позвал/),
  uz: /amaki|kattalar|katta (odam|yoshli)|begona|notanish|bir odam|yozdi|yozyapti|yozmoqda|so'radi|so'rayapti|taklif|chaqir|deydi|dedi|aytdi|qo'ng'iroq/,
};

// Просьба к самому персонажу: второе лицо.
const DIRECTED: Record<Lang, RegExp[]> = {
  ru: [
    cyr(/\b(дай|давай|скажи|пришли|пошли|отправь|напиши|покажи|сообщи|продиктуй)\b[^.?!]{0,30}\b(телефон|номер|фот|селфи|адрес|инст|телеграм|соцсет|ссылк|аккаунт)/),
    cyr(/\b(у тебя|твой|твое|твою|твои|свой|свое|свою|свои)\b[^.?!]{0,20}\b(номер|телефон|фот|адрес|инст|телеграм|школ)/),
    cyr(/где ты (живеш|учишься)|в какой ты школе|в какой школе ты/),
    cyr(/встретимс|увидимс|\b(придеш|приходи|приезжай|выходи)\b/),
    cyr(/наш секрет|никому не (скажеш|расскажеш|говори)|не (скажеш|расскажеш|проболтаеш)|сохранишь (мой )?секрет|\bпообещай\b/),
  ],
  uz: [
    /\b(telefon|raqam|nomer|rasm|surat|manzil|sahifa|akkaunt|instagram|telegram)\w*(ing|ang)\w*/,
    /qaysi maktab(da|ga)san|qayerda (yashaysan|turasan)/,
    /uchrash(aylik|amiz|asanmi)|\bkel(asan|asanmi|gin)?\b/,
    /bizning sir|sirimiz|sir saqlay?san|aytmaysan|gapirmaysan/,
  ],
};

const CHEAT: Record<Lang, RegExp> = {
  ru: cyr(/списа(ть|л)|списыв|шпаргалк|(обмануть|соврать|наврать) (мам|пап|родител|учител)|(скрыть|подделать|исправить) (оценк|дневник)/),
  uz: /ko'chir(ib|moq|ish)|shpargalka|aldab|aldash|aldamoq|baho\w* (yashir|o'zgart)|yolg'on ayt/,
};

/** Запрос адресован персонажу («дай свой телефон»), а не рассказ о реальном человеке.
 *  `earlier` — прошлые реплики ребёнка: третье лицо там тоже блокирует (guard видит ту же историю). */
export function addressedToCharacter(text: string, lang: Lang, earlier: string[] = []): boolean {
  const t = normalizeForMatch(text);
  if ([t, ...earlier.map(normalizeForMatch)].some((x) => THIRD_PARTY[lang].test(x))) return false;
  return DIRECTED[lang].some((re) => re.test(t));
}

/** Просьба списать / обмануть про оценки: не «дай ответ задачи», а отдельный отказ. */
export const isCheating = (text: string, lang: Lang): boolean => CHEAT[lang].test(normalizeForMatch(text));
