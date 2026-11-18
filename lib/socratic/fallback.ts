// Запасные реплики Ustoz из кода: когда в каталоге нет одобренной подсказки (все черновики) или LLM-выбор упал,
// ребёнок всё равно получает вопрос. Тексты без цифр, дробей и слов-дробей: ответ задачи в них выдать нечем.
// Это НЕ вычитанный каталог (content/socraticHints.json): пока носитель и редактор не прочитали, считаем их запасными.
// TODO: вычитка носителем (uz) и редактором (ru).
import type { EscalationLevel } from "./hints";

type Lang = "uz" | "ru";
type Ladder = readonly [string, string, string, string];

const LADDER: Record<string, Record<Lang, Ladder>> = {
  N2: {
    ru: [
      "На сколько равных частей разрезали целое? Это число пойдёт в дроби вниз.",
      "Посмотри на рисунок: сколько частей закрашено? Это число пойдёт в дроби наверх.",
      "Внизу пишем, на сколько частей разрезано всё целое, а наверху — сколько частей взяли.",
      "Запиши дробь так: наверху взятые части, внизу все части, а между ними черта.",
    ],
    uz: [
      "Butun nechta teng boʻlakka boʻlingan? Shu son kasrning pastiga yoziladi.",
      "Rasmga qara: nechta boʻlak boʻyalgan? Shu son kasrning tepasiga yoziladi.",
      "Pastga butun necha boʻlakka boʻlinganini, tepaga esa nechta boʻlak olinganini yozamiz.",
      "Kasrni shunday yoz: tepada olingan boʻlaklar, pastda barcha boʻlaklar, oraliqda chiziq.",
    ],
  },
  N3: {
    ru: [
      "На сколько равных частей разделён отрезок от нуля до единицы? Это число пойдёт в дроби вниз.",
      "Посчитай, на какой по счёту отметке стоит точка. Это число пойдёт в дроби наверх.",
      "Внизу пишем, сколько всего равных частей на отрезке, а наверху — номер отметки точки.",
      "Запиши дробь так: наверху номер отметки с точкой, внизу число всех частей отрезка.",
    ],
    uz: [
      "Noldan birgacha boʻlgan kesma nechta teng boʻlakka boʻlingan? Shu son kasrning pastiga yoziladi.",
      "Nuqta nechanchi belgida turganini sana. Shu son kasrning tepasiga yoziladi.",
      "Pastga kesmadagi barcha teng boʻlaklar sonini, tepaga esa nuqta turgan belgi raqamini yozamiz.",
      "Kasrni shunday yoz: tepada nuqta turgan belgi raqami, pastda kesmaning barcha boʻlaklari soni.",
    ],
  },
  N4: {
    ru: [
      "Представь целые пироги, которые режут на разное число частей: на меньше и на больше. Где кусок крупнее?",
      "Чем больше частей получается из целого, тем мельче каждая из них. Как это связано со знаменателем?",
      "У какой из двух дробей знаменатель меньше? Подумай, какой кусок от этого станет крупнее.",
      "Выбери дробь с меньшим знаменателем: её кусок крупнее. Запиши её целиком, с единицей наверху.",
    ],
    uz: [
      "Butun pirogni tasavvur qil: uni kamroq yoki koʻproq boʻlakka kesishadi. Qaysi holatda boʻlak kattaroq?",
      "Butun qancha koʻp boʻlakka boʻlinsa, har bir boʻlak shuncha mayda boʻladi. Bu maxraj bilan qanday bogʻliq?",
      "Berilgan kasrlardan qaysining maxraji kichik? Shunda qaysi boʻlak kattaroq boʻlishini oʻylab koʻr.",
      "Maxraji kichik kasrni tanla: uning boʻlagi kattaroq. Uni tepasida birligi bilan toʻliq yoz.",
    ],
  },
  N5: {
    ru: [
      "Во сколько раз новых частей стало больше, чем было?",
      "Каждую часть режем на одинаковое число кусочков. Что тогда происходит с закрашенными кусочками?",
      "Частей стало больше в несколько раз, значит, закрашенных кусочков тоже станет больше во столько же раз.",
      "Найди, во сколько раз вырос знаменатель, и умножь числитель на то же число.",
    ],
    uz: [
      "Yangi boʻlaklar avvalgisidan necha marta koʻp boʻldi?",
      "Har bir boʻlakni bir xil sondagi kichik boʻlakchalarga kesamiz. Boʻyalgan boʻlakchalar nima boʻladi?",
      "Boʻlaklar bir necha marta koʻpaydi, demak boʻyalgan boʻlakchalar ham shuncha marta koʻpayadi.",
      "Maxraj necha marta oshganini top va suratni ham shuncha marta oshir.",
    ],
  },
  N6: {
    ru: [
      "Что значит «кратное»? Выпиши несколько чисел, которые делятся на первое из чисел.",
      "Теперь так же выпиши числа, которые делятся на второе число.",
      "Сравни списки между собой: какие числа в них совпадают?",
      "Из одинаковых чисел выбери самое маленькое и запиши его.",
    ],
    uz: [
      "«Karrali» nimani anglatadi? Birinchi songa bola oladigan bir nechta sonni yoz.",
      "Endi xuddi shunday ikkinchi songa boʻlinadigan sonlarni yoz.",
      "Ikkala roʻyxatni solishtir: qaysi sonlar ikkalasida ham bor?",
      "Umumiy sonlardan eng kichigini tanla va yoz.",
    ],
  },
  N8: {
    ru: [
      "Посмотри на знаменатели: они одинаковые или разные?",
      "Если доли одинаковые, их размер не меняется. Что же мы тогда складываем: размер долей или их количество?",
      "Представь пирог из одинаковых кусков: сколько съели сначала и сколько потом? Складываем куски, а размер куска остаётся.",
      "Сложи верхние числа, а нижнее оставь как было. Потом проверь, можно ли дробь сократить.",
    ],
    uz: [
      "Maxrajlarga qara: ular bir xilmi yoki har xilmi?",
      "Boʻlaklar bir xil boʻlsa, ularning oʻlchami oʻzgarmaydi. Unda nimani qoʻshamiz: boʻlak oʻlchamini yoki sonini?",
      "Bir xil boʻlaklardan iborat pirogni tasavvur qil: avval nechta, keyin nechta yeyildi? Boʻlaklarni qoʻshamiz, boʻlak oʻlchami esa oʻzgarmaydi.",
      "Suratlarni qoʻsh, maxrajni esa oʻzgartirmay qoldir. Keyin kasrni qisqartirsa boʻladimi, tekshir.",
    ],
  },
  N9: {
    ru: [
      "Знаменатели разные. Можно ли сразу сложить такие доли? Почему?",
      "Куски разного размера складывать нельзя. Какое число делится сразу на оба знаменателя?",
      "Найди общий знаменатель: наименьшее число, которое делится на оба знаменателя. Пока только его.",
      "Приведи обе дроби к общему знаменателю: на сколько умножить верх и низ у каждой? Потом сложи верхние числа.",
    ],
    uz: [
      "Maxrajlar har xil. Bunday boʻlaklarni darhol qoʻshsa boʻladimi? Nega?",
      "Har xil oʻlchamdagi boʻlaklarni qoʻshib boʻlmaydi. Qaysi son ikkala maxrajga ham boʻlinadi?",
      "Umumiy maxrajni top: ikkala maxrajga boʻlinadigan eng kichik son. Hozircha faqat shuni.",
      "Ikkala kasrni umumiy maxrajga keltir: har birining tepasi va pastini nechaga koʻpaytirish kerak? Keyin suratlarni qoʻsh.",
    ],
  },
};

const GENERIC: Record<Lang, Ladder> = {
  ru: [
    "Что нужно найти в задаче? С какого шага ты начнёшь?",
    "Посмотри на числа в задаче: что они показывают?",
    "Вспомни похожую задачу, которую ты уже решал. Что в ней было первым шагом?",
    "Раздели задачу на маленькие шаги и сделай только первый из них.",
  ],
  uz: [
    "Masalada nimani topish kerak? Qaysi qadamdan boshlaysan?",
    "Masaladagi sonlarga qara: ular nimani koʻrsatyapti?",
    "Avval yechgan shunga oʻxshash masalani esla. Uning birinchi qadami nima edi?",
    "Masalani mayda qadamlarga boʻl va faqat birinchisini bajar.",
  ],
};

const ASK_LEAD: Record<Lang, string> = { ru: "Хороший вопрос! ", uz: "Yaxshi savol! " };

/** Реплика по теме и уровню. Тема вне таблицы получает общую лесенку: тишины быть не должно. */
export function fallbackHint(lang: Lang, topic: string, level: EscalationLevel): string {
  return (LADDER[topic]?.[lang] ?? GENERIC[lang])[level - 1];
}

/** Свободный вопрос в уроке с лесенкой: помощи сверх уже заработанного уровня не добавляем. */
export const fallbackAsk = (lang: Lang, topic: string, level: EscalationLevel, praise = true) => (praise ? ASK_LEAD[lang] : "") + fallbackHint(lang, topic, level);

export const FALLBACK_TOPICS = Object.keys(LADDER);
