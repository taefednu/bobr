"use client";
// Только для разработки: все шаги диагностики стопкой для снимков. Без Convex.
import { notFound } from "next/navigation";
import { DiagnoseView } from "@/components/diagnose/DiagnoseView";
import { stubDiagnose } from "@/lib/ui/demo-data";

const noop = () => {};

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
