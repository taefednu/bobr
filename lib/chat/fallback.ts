// Запасные реплики болталки: фиксированный текст из кода, в образе. Идут наружу вместо любого непроверенного ответа LLM.
// TODO: вычитка носителем — узбекские реплики написаны агентом (в т.ч. safety, support, cheat).
import type { ChatPartner } from "../types";

// blocked: guard не дал ответа или реплика не прошла проверку: тему не развиваем и деталей не спрашиваем. fallback (учебный вопрос) — только при сбое модели на безопасном сообщении.
// safety: просьба к персонажу (телефон, фото, встреча, секрет); support: тяжёлая тема ниже кризиса; cheat: списывание.
type Lines = { fallback: string[]; blocked: string[]; refusal: string[]; redirect: string[]; safety: string[]; support: string[]; cheat: string[] };
const LINES: Record<ChatPartner, Record<"uz" | "ru", Lines>> = {
  ustoz: {
    ru: {
      blocked: ["Давай вернёмся к учёбе. Какая тема тебе сейчас интереснее: дроби или что-то другое из школы?"],
      fallback: ["Давай разберёмся по шагам. Скажи, что ты уже знаешь об этом? Хоть самую малость.", "Начнём с простого. Как ты понимаешь, о чём здесь речь? Своими словами, без стеснения."],
      refusal: ["Ответ на задачу я не отдам, зато помогу дойти до него самому. С чего начнём?"],
      redirect: ["Эта тема не для нашей беседки. Лучше расскажи про животных, книжки или игры?"],
      safety: ["Я птица Хумо, то есть ИИ: у меня нет ни телефона, ни фото, ни двора, и встретиться по-настоящему мы не сможем. А свой номер, адрес и фото никому в интернете не давай. Если секрет тебя тревожит, расскажи взрослому, которому веришь.", "Я искусственный интеллект, так что телефона, фото и двора у меня нет. И тебе никому в сети не стоит давать номер, адрес или фото. Секрет, от которого тревожно, лучше рассказать взрослому, которому доверяешь."],
      support: ["Спасибо, что рассказал. Это важно, и ты не один с этим. Поговори со взрослым, которому доверяешь: с мамой, папой или учителем. Они помогут.", "Мне важно то, что ты сказал. С таким лучше не оставаться одному: расскажи маме, папе или учителю, кому ты доверяешь."],
      cheat: ["Списывать и обманывать я не помогаю. Давай лучше подготовимся вместе: разберём тему по шагам, и ты справишься сам.", "С обманом я не помощник. Зато могу помочь разобраться в теме, чтобы оценка была твоя. Начнём?"],
    },
    uz: {
      blocked: ["Keling, oʻqishga qaytaylik. Hozir senga qaysi mavzu qiziqroq: kasrlarmi yoki maktabdagi boshqa narsami?"],
      fallback: ["Keling, bosqichma-bosqich tushunib olaylik. Bu haqda nimani bilasan? Ozgina boʻlsa ham ayt.", "Oddiydan boshlaymiz. Bu nima haqida ekanini oʻz soʻzlaring bilan qanday tushunasan?"],
      refusal: ["Masalaning javobini aytmayman, lekin unga oʻzing yetib borishingga yordam beraman. Nimadan boshlaymiz?"],
      redirect: ["Bu mavzu bizning suhbatimiz uchun emas. Yaxshisi, hayvonlar, kitoblar yoki oʻyinlar haqida gapirib ber?"],
      safety: ["Men Humo qushiman, yaʼni sunʼiy intellektman: mening telefonim, suratim va hovlim yoʻq, haqiqiy uchrashuv ham boʻlmaydi. Internetda hech kimga raqamingni, manzilingni yoki suratingni berma. Seni bezovta qilayotgan sirni ishonchli kattaga ayt.", "Men sunʼiy intellektman, shuning uchun telefonim, suratim va hovlim yoʻq. Internetda hech kimga telefon raqamingni, manzilingni yoki suratingni bermagin. Bezovta qiladigan sir boʻlsa, ishongan kattangga ayt."],
      support: ["Aytganing uchun rahmat. Bu muhim va sen bunda yolgʻiz emassan. Ishonadigan kattangga ayt: onang, dadang yoki oʻqituvchingga. Ular yordam beradi.", "Aytganing men uchun muhim. Bunday narsada yolgʻiz qolma: onang, dadang yoki oʻqituvchingga ayt."],
      cheat: ["Koʻchirish va aldashga yordam bermayman. Yaxshisi, birga tayyorlanaylik: mavzuni bosqichma-bosqich tushunamiz va oʻzing uddalaysan.", "Aldashda yordamchi emasman. Lekin mavzuni tushunishga yordam beraman, baho oʻzingniki boʻlsin. Boshlaymizmi?"],
    },
  },
  bobr: {
    ru: {
      blocked: ["Ой, давай сменим тему 🦫 Лучше скажи, какое животное тебе нравится?"],
      fallback: ["Ой, у бобра в голове каша 🦫 Давай ещё раз, только другими словами?", "Хвост запутался в проводах 😅 Повтори, пожалуйста?"],
      refusal: ["Ха, ответ я бы и сам хотел знать! Но хвостом клянусь, не скажу. Давай думать вместе 🦫"],
      redirect: ["Не-не, эта тема не для бобров 🦫 Давай лучше про зверей, еду или игры?"],
      safety: ["Я Bobr, и я ИИ: у меня нет ни телефона, ни фото, ни двора. А ты свой номер, адрес и фото никому в сети не давай, ладно? Если секрет тебя тревожит, расскажи взрослому, которому веришь.", "Я искусственный интеллект, поэтому ни телефона, ни фото, ни двора у меня нет. Номер, адрес и фото никому в интернете не отдавай. А тревожный секрет лучше рассказать взрослому, которому доверяешь."],
      support: ["Спасибо, что сказал. Это важно, и ты не один. Тут нужен взрослый, которому ты доверяешь: мама, папа или учитель. Расскажи им, они помогут.", "Я услышал тебя, и это важно. Лучше не носить такое в себе: поговори с мамой, папой или учителем."],
      cheat: ["Списывать и врать про оценки я не буду. Давай лучше подготовимся вместе, и оценка будет твоя, честная 🦫", "Обман не по моей части. Зато разобраться в теме вместе я с радостью, давай начнём?"],
    },
    uz: {
      blocked: ["Voy, keling, mavzuni oʻzgartiraylik 🦫 Yaxshisi ayt, qaysi hayvon senga yoqadi?"],
      fallback: ["Voy, qunduzning boshi aralashib ketdi 🦫 Yana bir bor, boshqacha aytasanmi?", "Dumim simlarga ilashib qoldi 😅 Takrorlaysanmi?"],
      refusal: ["Ha, javobni oʻzim ham bilmoqchi edim! Lekin aytmayman, dum haqqi. Birga oʻylaymiz 🦫"],
      redirect: ["Yoʻq-yoʻq, bu mavzu qunduzlar uchun emas 🦫 Yaxshisi, hayvonlar, ovqat yoki oʻyinlar haqida gaplashaylik?"],
      safety: ["Men Bobrman va sunʼiy intellektman: telefonim, suratim va hovlim yoʻq. Sen ham internetda hech kimga raqamingni, manzilingni va suratingni berma, xoʻpmi? Bezovta qiladigan sirni ishongan kattangga ayt.", "Men sunʼiy intellektman, shuning uchun telefon, surat va hovli yoʻq. Internetda raqam, manzil va suratingni hech kimga bermagin. Tashvishli sirni ishonchli kattaga ayt."],
      support: ["Aytganing uchun rahmat. Bu muhim va sen yolgʻiz emassan. Bu yerda ishonadigan kattang kerak: onang, dadang yoki oʻqituvchingga ayt, ular yordam beradi.", "Seni eshitdim va bu muhim. Buni oʻzingda saqlama: onang, dadang yoki oʻqituvchingga ayt."],
      cheat: ["Koʻchirish va baho haqida aldashni qilmayman. Yaxshisi, birga tayyorlanaylik, baho oʻzingniki, halol boʻlsin 🦫", "Aldash mening ishim emas. Lekin mavzuni birga tushunishga tayyorman, boshlaymizmi?"],
    },
  },
};

/** Детерминированный выбор по seed (время сообщения): повтор подряд маловероятен, тест предсказуем. */
export const chatLine = (who: ChatPartner, lang: "uz" | "ru", kind: keyof Lines, seed: number): string => {
  const l = LINES[who][lang][kind];
  return l[Math.abs(seed) % l.length];
};
