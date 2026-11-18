"use client";
import { useRouter } from "next/navigation";
import { PlanView } from "@/components/plan/PlanView";
import { useT } from "@/lib/i18n";
import { stubPlan } from "@/lib/ui/demo-data";

// Фиксированное «сейчас», чтобы разметка на сервере и в браузере совпала.
const DEMO_NOW = Date.parse("2026-11-18T12:00:00Z");

export default function Page() {
  const router = useRouter();
  const { lang } = useT();
  // TODO(core): plan:view, plan:accept({token})
  return <PlanView plan={stubPlan(DEMO_NOW, lang)} onContinue={() => router.push("/mahalla")} />;
}
