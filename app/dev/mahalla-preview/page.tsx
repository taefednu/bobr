"use client";
// Только для разработки: махалля со всеми пятью состояниями домов. Без Convex.
import { notFound } from "next/navigation";
import { MahallaView } from "@/components/mahalla/MahallaView";
import { ChildShell } from "@/components/child/ChildShell";
import { useT } from "@/lib/i18n";
import { stubMahalla } from "@/lib/ui/demo-data";
import type { HouseState } from "@/lib/types";

const DEMO_NOW = Date.parse("2026-11-18T12:00:00Z");
const STATES: Record<string, HouseState> = {
  N1: "alive", N2: "built", N3: "dimmed", N4: "scaffold", N8: "scaffold",
  N5: "empty", N6: "empty", N7: "empty", N9: "empty", N10: "empty",
};

export default function MahallaPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  const { lang } = useT();
  const base = stubMahalla(DEMO_NOW, lang);
  const view = { ...base, houses: base.houses.map((h) => ({ ...h, state: STATES[h.topic] ?? h.state })) };
  return (
    <ChildShell>
      <MahallaView view={view} onStart={() => {}} />
    </ChildShell>
  );
}
