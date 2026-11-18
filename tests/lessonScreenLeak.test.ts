// Экран урока v3 не показывает готовый ответ до верного решения: ни текстом, ни подписью, ни aria.
// Серверный рендер LessonScreen на всех формах задач, вердиктах и компонентах; ответ задачи подкладываем и в компонент (худший случай).
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { LessonViewData } from "../components/lesson/LessonView";
import { LessonScreen } from "../components/v3/lesson/LessonScreen";
import { generateTask } from "../lib/fractions/generator";
import { taskPicture } from "../convex/lessonView";
import type { TopicId } from "../lib/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {}, replace: () => {} }) }));

const noop = () => {};
const html = (view: LessonViewData) =>
  renderToStaticMarkup(createElement(LessonScreen, {
    view, busy: false, failed: false, answer: "", text: "",
    onAnswerChange: noop, onTextChange: noop, onSubmitAnswer: noop, onSubmitText: noop,
    onHint: noop, onStart: noop, onLeaveCrisis: noop, onFinish: noop, onBack: noop,
  }));

const VERDICTS = [null, "ok", "almost", "misconception:M9", "wrong", "unparsed"];
const COMPONENTS = [null, "pie", "strip", "line"] as const;

describe("LessonScreen не называет ответ", () => {
  it("задача из жалобы: пирог на 3 части, взяли 2, под лепёшкой нет 2/3", () => {
    const view: LessonViewData = {
      state: "LESSON_SOLVE", lastVerdict: "wrong", hintLevel: 1, crisis: null,
      task: { topic: "N2", kind: "word", params: { num: "2", den: "3" }, numbersShown: ["2", "3"] },
      reply: { text: null, component: { type: "pie", params: [{ key: "v0", value: "2/3" }] }, hintButton: true },
    };
    expect(html(view)).not.toContain("2/3");
  });

  it("все темы, виды, вердикты и компоненты", () => {
    let checked = 0;
    for (const topic of ["N2", "N5", "N6", "N8", "N9"] as TopicId[]) {
      for (const kind of ["word", "picture", "missing"] as const) {
        for (let seed = 1; seed <= 3; seed++) {
          const task = generateTask(topic, kind, seed);
          for (const verdict of VERDICTS) {
            for (const comp of COMPONENTS) {
              for (const hintLevel of [0, 2, 4]) {
                const view: LessonViewData = {
                  state: "LESSON_SOLVE", lastVerdict: verdict, hintLevel, crisis: null,
                  task: { topic, kind, params: task.params, numbersShown: task.numbersShown },
                  reply: { text: null, component: comp ? { type: comp, params: [{ key: "v0", value: task.answer }] } : null, hintButton: hintLevel < 4 },
                };
                // плашка вердикта — постоянная строка i18n (в ней есть пример «1/2»), к ответу задачи отношения не имеет
                const out = html(view).replace(/<p role="status"[^>]*data-ref="verdict".*?<\/p>/, "");
                // дробный ответ не должен встречаться в разметке (текст, aria, атрибуты); целый проверить подстрокой нельзя
                if (task.answer.includes("/")) {
                  const [n, d] = task.answer.split("/");
                  if (out.includes(task.answer)) throw new Error(`ответ ${task.answer} в разметке: ${topic}/${kind}/${seed}/${verdict}/${comp}`);
                  expect(out).not.toMatch(new RegExp(`aria-label="${n}/${d}"`));
                }
                checked++;
              }
            }
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(500);
  }, 60_000);

  it("задача picture: рисунок-условие с сервера на экране, подписей с дробью нет", () => {
    for (const topic of ["N2", "N3", "N4", "N5", "N6", "N8", "N9"] as TopicId[]) {
      for (let seed = 1; seed <= 5; seed++) {
        const task = generateTask(topic, "picture", seed);
        const view = {
          state: "LESSON_SOLVE", lastVerdict: "wrong", hintLevel: 0, crisis: null,
          task: { topic, kind: "picture", params: task.params, numbersShown: task.numbersShown },
          picture: taskPicture(task), reply: { text: null, component: null, hintButton: true },
        } as unknown as LessonViewData;
        const out = html(view);
        expect(out, `${topic}/${seed}`).toContain('data-ref="picture"');
        expect(out).toMatch(/<svg/);
        const noVerdict = out.replace(/<p role="status"[^>]*data-ref="verdict".*?<\/p>/, "");
        if (topic === "N4") {
          // Выбор из показанных дробей: ответ назван в тексте условия, экран ничем его не выделяет.
          const paragraph = /data-ref="task"[^>]*><p class="v3-type-card">(.*?)<\/p>/.exec(noVerdict)![1];
          const count = (hay: string) => hay.split(task.answer).length - 1;
          expect(count(noVerdict), `N4/${seed}: ответ вне текста условия`).toBe(count(paragraph));
          // обе дроби нарисованы одинаково: две лепёшки с одной и той же подписью, без доп. подписей и подсветки
          const svgs = noVerdict.match(/<svg[^>]*aria-label="[^"]*"/g) ?? [];
          expect(svgs).toHaveLength(2);
          expect(new Set(svgs.map((x) => /aria-label="([^"]*)"/.exec(x)![1])).size).toBe(1);
          const pic = /data-ref="picture">(.*?<\/svg><\/div>)<\/div>/.exec(noVerdict)?.[1] ?? "";
          expect(pic.replace(/<svg.*?<\/svg>/g, "")).not.toMatch(/<text|<p|<span/);
        } else if (task.answer.includes("/")) expect(noVerdict).not.toContain(task.answer);
      }
    }
  });
});
