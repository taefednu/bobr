"use client";
// Только для разработки: все состояния урока стопкой для снимков. Без Convex. ?crisis=1 — только оверлей кризиса.
import { notFound, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LessonView, type LessonViewData, type LessonViewProps } from "@/components/lesson/LessonView";

const noop = () => {};
const base: LessonViewData = {
  state: "PRACTICE", lastVerdict: null, hintLevel: 0, crisis: null, reply: null,
  task: { topic: "N9", kind: "word", params: { a: "1", b: "2", c: "1", d: "3" }, numbersShown: ["1/2", "1/3"] },
};
const reply = (over: Partial<NonNullable<LessonViewData["reply"]>> = {}) => ({
  text: "Ustoz: dev fixture", component: null, hintButton: true, ...over,
});
const params = (...v: string[]) => v.map((value, i) => ({ key: `v${i}`, value }));

const fixtures: { key: string; view: LessonViewData | null; busy?: boolean; failed?: boolean }[] = [
  { key: "start", view: null },
  { key: "task-no-reply", view: base },
  { key: "busy", view: { ...base, reply: reply() }, busy: true },
  ...["ok", "almost", "misconception", "wrong", "unparsed"].map((v) => ({
    key: `verdict-${v}`, view: { ...base, lastVerdict: v, reply: reply() },
  })),
  { key: "hint-2", view: { ...base, hintLevel: 2, lastVerdict: "wrong", reply: reply() } },
  { key: "pie", view: { ...base, reply: reply({ component: { type: "pie", params: params("1/2", "1/3") } }) } },
  { key: "strip", view: { ...base, reply: reply({ component: { type: "strip", params: params("1/2", "1/3") } }) } },
  { key: "line", view: { ...base, reply: reply({ component: { type: "line", params: params("1/2", "1/3") } }) } },
  { key: "topic-done", view: { ...base, state: "TOPIC_DONE", lastVerdict: "ok", reply: reply({ hintButton: false }) } },
  { key: "failed", view: base, failed: true },
];

const common: Omit<LessonViewProps, "view" | "busy" | "failed"> = {
  answer: "", text: "", onAnswerChange: noop, onTextChange: noop, onSubmitAnswer: noop, onSubmitText: noop,
  onHint: noop, onStart: noop, onLeaveCrisis: noop,
};

function Preview() {
  const crisis = useSearchParams().get("crisis") === "1";
  if (process.env.NODE_ENV === "production") notFound();
  if (crisis) {
    return <LessonView {...common} busy={false} failed={false} view={{ ...base, state: "CRISIS", crisis: { text: "Dev crisis text", numbers: ["000"] } }} />;
  }
  return (
    <main className="mx-auto grid max-w-2xl gap-16 bg-sand px-4 py-10">
      {fixtures.map(({ key, view, busy, failed }) => (
        <section key={key} data-testid={key} className="grid gap-2">
          <code className="text-label text-ink-muted">{key}</code>
          <LessonView {...common} view={view} busy={!!busy} failed={!!failed} />
        </section>
      ))}
    </main>
  );
}

export default function LessonPreview() {
  return <Suspense><Preview /></Suspense>;
}
