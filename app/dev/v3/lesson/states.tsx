"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { LessonViewData } from "@/components/lesson/LessonView";
import { LessonScreen } from "@/components/v3/lesson/LessonScreen";

// Фикстуры только для сверки состояний; реплики Ustoz и числа — данные, не UI-строки.
const noop = () => {};
const base: LessonViewData = {
  state: "PRACTICE", lastVerdict: null, hintLevel: 0, crisis: null, reply: null,
  task: { topic: "N9", kind: "word", params: { a: "1", b: "2", c: "1", d: "3" }, numbersShown: ["1/2", "1/3"] },
};
const reply = (o: Partial<NonNullable<LessonViewData["reply"]>> = {}) => ({ text: "Давай по шагам: какие куски у тебя одного размера?", component: null, hintButton: true, ...o });
const params = (...v: string[]) => v.map((value, i) => ({ key: `v${i}`, value }));
const task = (topic: string, kind: string, p: Record<string, string>, shown: string[]): LessonViewData["task"] => ({ topic, kind, params: p, numbersShown: shown });

type S = { view: LessonViewData | null | undefined; busy?: boolean; failed?: boolean; answer?: string; ask?: boolean };
const STATES: Record<string, S> = {
  loading: { view: undefined },
  start: { view: null },
  "task-no-reply": { view: base },
  "input-typed": { view: { ...base, reply: reply() }, answer: "5/6" },
  busy: { view: { ...base, reply: reply() }, busy: true, answer: "5/6" },
  "verdict-ok": { view: { ...base, lastVerdict: "ok", reply: reply({ text: "Верно! Держи следующую." }) } },
  "verdict-almost": { view: { ...base, lastVerdict: "almost", reply: reply({ text: "Почти. Что можно сделать с числителем и знаменателем?" }) } },
  "verdict-misconception": { view: { ...base, lastVerdict: "misconception", reply: reply({ text: "Смотри: куски разного размера. Как их уравнять?" }) } },
  "verdict-wrong": { view: { ...base, lastVerdict: "wrong", hintLevel: 1, reply: reply() } },
  "verdict-unparsed": { view: { ...base, lastVerdict: "unparsed", reply: reply({ hintButton: false }) } },
  "hint-3": { view: { ...base, hintLevel: 3, lastVerdict: "wrong", reply: reply() } },
  socratic: { view: { ...base, state: "LESSON_SOLVE", hintLevel: 3, socratic: { taskInstanceId: "dev", attemptCount: 4, escalationLevel: 4 }, reply: reply({ text: null, component: { type: "pie", params: params("1/2", "1/3") } }) } },
  pie: { view: { ...base, reply: reply({ component: { type: "pie", params: params("1/2", "1/3") } }) } },
  strip: { view: { ...base, reply: reply({ component: { type: "strip", params: params("1/2", "1/3") } }) } },
  line: { view: { ...base, reply: reply({ component: { type: "line", params: params("1/2", "1/3") } }) } },
  "task-n5": { view: { ...base, task: task("N5", "picture", { num: "2", den: "3", toDen: "6" }, ["2/3"]), reply: reply({ component: { type: "pie", params: params("2/3") } }) } },
  "task-n6-line": { view: { ...base, task: task("N6", "picture", { a: "4", b: "6" }, ["4", "6"]), reply: reply({ component: { type: "line", params: params("12/6") } }) } },
  "task-missing": { view: { ...base, task: task("N8", "missing", { a: "2", c: "3", den: "7", toDen: "7" }, ["2/7", "3/7"]), reply: reply() } },
  "can-teach": { view: { ...base, state: "TOPIC_DONE", canTeach: true, lastVerdict: "ok", reply: reply({ text: "Ты справился сам!", hintButton: false }) } },
  "topic-done": { view: { ...base, state: "TOPIC_DONE", lastVerdict: "ok", reply: reply({ text: "Верно!", hintButton: false }) } },
  failed: { view: base, failed: true },
  "ask-open": { view: { ...base, reply: reply() }, ask: true },
  crisis: { view: { ...base, crisis: { text: "Мне важно, как ты. Поговори сейчас с кем-то из взрослых, кому доверяешь.", numbers: ["112"] } } },
};

export function States() {
  const s = useSearchParams().get("s");
  const [mounted, setMounted] = useState(false);
  const [text, setText] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);
  const st = s ? STATES[s] : null;
  useEffect(() => {
    if (!st?.ask || !mounted) return;
    document.querySelector<HTMLElement>('[data-ref="ask"]')?.click();
  }, [st, mounted]);
  if (!st) {
    return (
      <div className="flex flex-wrap gap-4 bg-white p-4">
        {Object.keys(STATES).map((k) => (
          <figure key={k} className="m-0"><figcaption className="text-sm">{k}</figcaption><iframe title={k} src={`?s=${k}`} width={390} height={845} className="border" /></figure>
        ))}
      </div>
    );
  }
  if (!mounted) return null;
  return (
    <LessonScreen
      view={st.view} busy={!!st.busy} failed={!!st.failed}
      answer={answer ?? st.answer ?? ""} text={text}
      onAnswerChange={setAnswer} onTextChange={setText}
      onSubmitAnswer={noop} onSubmitText={noop} onHint={noop} onStart={noop} onLeaveCrisis={noop} onFinish={noop} onBack={noop}
    />
  );
}
