"use client";
// Только для разработки: махалля со всеми пятью состояниями домов. Без Convex.
import { notFound } from "next/navigation";
import { MahallaView } from "@/components/mahalla/MahallaView";
import { ChildShell } from "@/components/child/ChildShell";
import { useT } from "@/lib/i18n";
import { graph } from "@/lib/content";
import type { MahallaView as View } from "@/lib/ui/types";
import type { HouseState } from "@/lib/types";

const STATES: Record<string, HouseState> = {
  N1: "alive", N2: "built", N3: "dimmed", N4: "scaffold", N8: "scaffold",
  N5: "empty", N6: "empty", N7: "empty", N9: "empty", N10: "empty",
};

export default function MahallaPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  const { lang } = useT();
  const view: View = {
    lang, state: "HOME", next: "N8",
    houses: graph.topics.map((t) => ({
      topic: t.id, title: t.title[lang], state: STATES[t.id] ?? "empty", prereqs: t.prereqs, inPlan: true, canStart: true,
    })),
  };
  return (
    <ChildShell>
      <MahallaView view={view} onStart={() => {}} />
    </ChildShell>
  );
}
