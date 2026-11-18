// Урок с лесенкой: Ustoz не молчит. Запасные реплики из кода покрывают все стартуемые темы, уровни и языки,
// проходят те же серверные проверки, что и каталожная подсказка, и не выдают ответ. Рисунок-условие picture приходит с сервера.
import { describe, expect, it } from "vitest";
import { taskPicture } from "../convex/lessonView";
import { generateTask } from "../lib/fractions/generator";
import { postUstoz } from "../lib/llm";
import { approvedHints } from "../lib/socratic/hints";
import { fallbackAsk, fallbackHint, FALLBACK_TOPICS } from "../lib/socratic/fallback";
import type { TopicId } from "../lib/types";

const TOPICS = ["N2", "N3", "N4", "N5", "N6", "N8", "N9"] as TopicId[];
const LEVELS = [1, 2, 3, 4] as const;
const KINDS = ["word", "picture", "missing"] as const;

describe("запасные реплики Ustoz", () => {
  it("лесенка есть для всех стартуемых тем", () => {
    expect([...FALLBACK_TOPICS].sort()).toEqual([...TOPICS].sort());
  });

  it("каталог пока без одобренных подсказок: без запасных реплик ребёнок остался бы без ответа", () => {
    const task = generateTask("N8", "word", 1);
    for (const lang of ["uz", "ru"] as const) for (const level of LEVELS) {
      expect(approvedHints({ lang, escalationLevel: level, misconceptionTag: null, interestTheme: "Football", task })).toEqual([]);
    }
  });

  it("все темы, уровни, виды, языки: реплика есть, ответ не утекает, числа не лишние", () => {
    let checked = 0;
    const bad = new Set<string>();
    for (const topic of TOPICS) for (const kind of KINDS) for (let seed = 1; seed <= 40; seed++) {
      const task = generateTask(topic, kind, seed);
      for (const lang of ["uz", "ru"] as const) for (const level of LEVELS) for (const make of [fallbackHint, fallbackAsk]) {
        const reply = make(lang, topic, level);
        expect(reply.length).toBeGreaterThan(10);
        const post = postUstoz({ reply, component: null, intent: "hint", hintLevel: level - 1, revealsAnswer: false }, {
          answer: task.answer, numbersShown: task.numbersShown, childNumbers: [], recent: [], operands: [], childFractions: [],
        });
        if (!post.result.ok) bad.add(`${topic}/${lang}/${level}: ${post.result.reason}: ${reply}`);
        checked++;
      }
    }
    expect([...bad]).toEqual([]);
    expect(checked).toBeGreaterThan(4000);
  });

  it("уровни различаются, uz без кириллицы, ru без латиницы-заглушек", () => {
    for (const topic of TOPICS) for (const lang of ["uz", "ru"] as const) {
      const texts = LEVELS.map((l) => fallbackHint(lang, topic, l));
      expect(new Set(texts).size).toBe(4);
      for (const t of texts) expect(/[а-яё]/i.test(t)).toBe(lang === "ru");
    }
    expect(fallbackHint("ru", "N99", 1)).toBeTruthy(); // неизвестная тема — общая лесенка, не тишина
  });
});

describe("taskPicture: рисунок-условие", () => {
  it("picture получает рисунок на всех темах, остальные виды — нет", () => {
    for (const topic of TOPICS) for (let seed = 1; seed <= 40; seed++) {
      const pic = generateTask(topic, "picture", seed);
      const got = taskPicture(pic);
      expect(got, `${topic}/${seed}`).not.toBeNull();
      expect(got!.cells.length).toBeGreaterThan(0);
      expect(taskPicture(generateTask(topic, "word", seed))).toBeNull();
      expect(taskPicture(generateTask(topic, "missing", seed))).toBeNull();
    }
  });

  it("в данных рисунка нет строк: строки-дроби с ответом задачи в useQuery не попадают", () => {
    for (const topic of TOPICS) for (let seed = 1; seed <= 40; seed++) {
      const task = generateTask(topic, "picture", seed);
      const json = JSON.stringify(taskPicture(task));
      expect(json).not.toContain(`"${task.answer}"`);
      expect(json).not.toContain("/");
    }
  });
});
