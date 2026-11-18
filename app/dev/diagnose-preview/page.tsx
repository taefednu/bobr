"use client";
// Только для разработки: все шаги диагностики стопкой для снимков. Без Convex.
import { notFound } from "next/navigation";
import { DiagnoseView } from "@/components/diagnose/DiagnoseView";
import type { DiagnoseView as View } from "@/lib/ui/types";

const noop = () => {};
// Локальные фикстуры: те же формы params, что у diagnose:view. Порядок вариантов перемешан.
const PROBES: NonNullable<View["probe"]>[] = [
  { id: "p-N9", topic: "N9", kind: "mcq", params: { a: "1", b: "2", c: "1", d: "3" }, numbersShown: ["1", "2", "1", "3"], options: ["2/5", "5/6", "1/5", "3/6"] },
  { id: "p-N8", topic: "N8", kind: "mcq", params: { a: "1", c: "2", den: "5" }, numbersShown: ["1", "5", "2", "5"], options: ["3/5", "3/10", "2/5", "1/10"] },
  { id: "p-N2", topic: "N2", kind: "mcq", params: { num: "3", den: "8" }, numbersShown: ["3", "8"], options: ["5/8", "3/5", "3/8", "1/8"] },
  { id: "p-N5", topic: "N5", kind: "mcq", params: { num: "1", den: "2", toDen: "6" }, numbersShown: ["1", "2", "6"], options: ["2", "3", "4", "6"] },
  { id: "p-N6", topic: "N6", kind: "mcq", params: { a: "2", b: "3" }, numbersShown: ["2", "3"], options: ["5", "12", "6", "1"] },
];
const stubDiagnose = (step: number): View => {
  const probe = PROBES[step] ?? null;
  return { state: probe ? "DIAGNOSE" : "PLAN", asked: step, maxProbes: PROBES.length, probe };
};

export default function DiagnosePreview() {
  if (process.env.NODE_ENV === "production") notFound();
  const views = [0, 1, 2, 3, 4, 5].map((s) => ({ key: `step-${s}`, view: stubDiagnose(s), busy: false }));
  views.push({ key: "busy", view: stubDiagnose(1), busy: true });
  return (
    <main className="mx-auto grid max-w-xl gap-16 px-4 py-10">
      {views.map(({ key, view, busy }) => (
        <section key={key} data-testid={key} className="grid gap-2">
          <code className="text-label text-ink-muted">{key}</code>
          <DiagnoseView view={view} busy={busy} onAnswer={noop} onDone={noop} />
        </section>
      ))}
    </main>
  );
}
