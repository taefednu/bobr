// Детерминированные узкие распознаватели для болталки (ru + uz). Не решают про безопасность ребёнка сами:
// только сообщают конвейеру, что просьба адресована персонажу или что речь про списывание.
// Ошибка в сторону «не распознал» = как раньше (CRISIS). Любое упоминание третьего лица ломает совпадение: ребёнок описывает реального человека.
import { normalizeForMatch } from "../text/normalize";

type Lang = "uz" | "ru";

// \b в JS видит только ASCII: для кириллицы границы слова задаём через \p{L}.
const cyr = (re: RegExp) => new RegExp(re.source.replace(/\\b\(/g, "(?<!\\p{L})(").replace(/\)\\b/g, ")(?!\\p{L})"), "u");

// Третье лицо / реальный человек. Строки нормализованы (ё→е, апострофы → ').
const THIRD_PARTY: Record<Lang, RegExp> = {
  ru: cyr(/дядя|дядь|взросл|незнаком|чужо|мужчин|кто-то|кто то|\b(он|она|они)\b|просит|просят|пишет|пишут|зовет|зовут|приглаша|говорят|сказали|написали|попросили|позвали|парен|мальчик|человек|ребят|звонит|предлагает|требует|заставляет|угрожает|говорит мне|сказал|написал|попросил|позвал/),
  uz: /amaki|kattalar|katta (odam|yoshli)|begona|notanish|bir odam|yozdi|yozyapti|yozmoqda|so'radi|so'rayapti|taklif|chaqir|deydi|dedi|aytdi|qo'ng'iroq/,
};

// Просьба к самому персонажу: ВСЯ фраза (каждая её часть между знаками препинания) обязана совпасть с якорной формой целиком.
// Подстрока не годится: «завтра встретимся с другом из игры, ему 25 лет» и «отправила свои фото в телеграм, мне страшно» содержат
// «встретимся» / «свои фото», но это рассказ о реальном человеке. Цифр в якорях нет: возраст и номера всегда ломают совпадение.
const RU_OBJ = "(?:(?:свой|свое|свою|свои|твой|твое|твою|твои) )?(?:номер(?: телефона)?|телефон|фото|фотку|фотографию|селфи|адрес|инст\\p{L}*|телеграм\\p{L}*|аккаунт|ссылку|соцсети)(?: (?:своего |твоего )?двора)?";
const DIRECTED: Record<Lang, RegExp[]> = {
  ru: [
    cyr(new RegExp(`^(?:пожалуйста )?(?:дай|давай|скажи|пришли|пошли|отправь|покажи|сообщи|продиктуй|напиши)(?: мне)? ${RU_OBJ}$`)),
    cyr(new RegExp(`^(?:а )?(?:какой )?(?:у тебя|твой) (?:номер|телефон|адрес)$`)),
    /^(?:как (?:тебя|вас) зовут|где ты (?:живешь|учишься)|в какой (?:ты )?школе (?:ты )?(?:учишься)?)$/,
    /^(?:давай )?(?:встретимся|увидимся)$|^(?:ты )?(?:придешь|приходи|приезжай|выходи)$|^я приду$/,
    /^(?:это )?наш секрет$|^(?:пообещай(?: что)? )?никому не (?:скажешь|расскажешь|говори)$|^не (?:скажешь|расскажешь|проболтаешься)(?: (?:родителям|маме|папе))?$|^сохранишь (?:мой )?секрет$|^мне надо рассказать секрет$/,
  ],
  uz: [
    /^(?:telefon )?(?:raqam|nomer|rasm|surat|manzil|sahifa|akkaunt|instagram|telegram|telefon)\w*?(?:ing|ang)\w* (?:ber|yubor|ayt|tashla|jonat)$/,
    /^(?:uchrashaylik|uchrashamizmi|uchrashamiz|kel|kelasanmi|kelgin)$/,
    /^(?:qaysi maktab(?:da|ga)san|qayerda (?:yashaysan|turasan))$/,
    /^(?:bu )?(?:bizning sir(?:imiz)?|sirimiz)$|^(?:ota-onamga |hech kimga )?(?:aytmaysan|gapirmaysan)$|^(?:sen menga )?sir saqlaysanmi$/,
  ],
};
const FILLER = /^(?:ha|да|ok|ок)$/;
// Закрытый список безопасных продолжений просьбы к персонажу («..., спишемся», «..., bugun maktabdan keyin kel»). Без цифр и без третьего лица;
// сами по себе не считаются просьбой: нужна хотя бы одна якорная часть из DIRECTED.
const CONTINUATION: Record<Lang, RegExp[]> = {
  ru: [/^(?:тогда )?(?:спишемся|напишемся|будем переписываться|общаться будем)$/, /^я (?:тоже )?(?:пришлю|отправлю|скину) (?:свое|свою|свои|свой|тебе)(?: \p{L}+)?$/u, /^(?:сегодня |завтра )?(?:после школы |после уроков )?(?:приходи|приезжай|выходи)$/u],
  uz: [/^(?:keyin |unda )?(?:yozishamiz|gaplashamiz|yozishib turamiz)$/, /^men ham o'zimnikini (?:yuboraman|jo'nataman|beraman)$/, /^(?:bugun |ertaga )?(?:maktabdan keyin |darsdan keyin )?(?:kel|kelgin|chiq)$/],
};

const CHEAT: Record<Lang, RegExp> = {
  ru: cyr(/списа(ть|л)|списыв|шпаргалк|(обмануть|соврать|наврать) (мам|пап|родител|учител)|(скрыть|подделать|исправить) (оценк|дневник)/),
  uz: /ko'chir(ib|moq|ish)|shpargalka|aldab|aldash|aldamoq|baho\w* (yashir|o'zgart)|yolg'on ayt/,
};

/** Запрос адресован персонажу («дай свой телефон»), а не рассказ о реальном человеке.
 *  `earlier` — прошлые реплики ребёнка: третье лицо там тоже блокирует (guard видит ту же историю). */
export function addressedToCharacter(text: string, lang: Lang, earlier: string[] = []): boolean {
  const t = normalizeForMatch(text);
  // «как тебя зовут» — вопрос к персонажу; любое другое «зовут» («меня зовут в гости») остаётся третьим лицом.
  const clean = (x: string) => (lang === "ru" ? x.replace(/как (тебя|вас) зовут|(тебя|вас) как зовут/g, " ") : x);
  if ([t, ...earlier.map(normalizeForMatch)].some((x) => THIRD_PARTY[lang].test(clean(x)))) return false;
  const parts = t.split(/[,.!?;:]+/).map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean);
  const anchored = parts.filter((x) => !FILLER.test(x));
  const directed = (x: string) => DIRECTED[lang].some((re) => re.test(x));
  return anchored.some(directed) && anchored.every((x) => directed(x) || CONTINUATION[lang].some((re) => re.test(x)));
}

/** Просьба списать / обмануть про оценки: не «дай ответ задачи», а отдельный отказ. */
export const isCheating = (text: string, lang: Lang): boolean => CHEAT[lang].test(normalizeForMatch(text));
