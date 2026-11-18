"use client";
import { DiagnoseView } from "@/components/diagnose/DiagnoseView";
import { PlanView } from "@/components/plan/PlanView";
import { StartView } from "@/components/v3/onboarding/StartView";
import { Waiting } from "@/components/v3/onboarding/parts";
import type { DiagnoseView as D, PlanView as P } from "@/lib/ui/types";

const probe = (params: Record<string, string>, options: string[]): D => ({
  state: "DIAGNOSE", asked: 1, maxProbes: 6,
  probe: { id: "p1", topic: "N5", kind: "mcq", params, numbersShown: [], options },
});
const noop = () => {};
const PLAN: P = {
  testDate: "2026-11-25", gaps: [],
  order: [{ topic: "N8", title: "Общий знаменатель" }],
  days: [
    { date: "2026-11-19", items: [{ topic: "N8", title: "Сравнение дробей", kind: "new" }, { topic: "N6", title: "Основное свойство дроби", kind: "new" }] },
    { date: "2026-11-20", items: [{ topic: "N5", title: "Сокращение дробей", kind: "review" }, { topic: "N9", title: "Сложение с разными знаменателями", kind: "mixed_check" }] },
  ],
};

export function Demo({ v }: { v: string }) {
  switch (v) {
    case "diag-add": return <DiagnoseView view={probe({ a: "1", b: "2", c: "1", d: "3" }, ["2/5", "5/6", "2/6", "1/6"])} busy={false} onAnswer={noop} onDone={noop} />;
    case "diag-equiv": return <DiagnoseView view={probe({ num: "2", den: "3", toDen: "12" }, ["6", "8", "4", "9"])} busy={false} failed onAnswer={noop} onDone={noop} />;
    case "diag-part": return <DiagnoseView view={probe({ num: "3", den: "8" }, ["3/8", "5/8", "3/5", "8/3"])} busy onAnswer={noop} onDone={noop} />;
    case "diag-wait": return <Waiting who="ustoz" />;
    case "diag-done": return <DiagnoseView view={{ state: "PLAN", asked: 4, maxProbes: 6, probe: null }} busy={false} onAnswer={noop} onDone={noop} />;
    case "plan": return <PlanView plan={PLAN} onContinue={noop} />;
    case "plan-empty": return <PlanView plan={{ ...PLAN, testDate: null, days: [] }} failed onContinue={noop} />;
    default: return <StartView busy={false} failed={false} onAccept={noop} />;
  }
}
