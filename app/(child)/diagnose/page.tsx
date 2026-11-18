"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DiagnoseView } from "@/components/diagnose/DiagnoseView";
import { stubDiagnose } from "@/lib/ui/demo-data";

export default function Page() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  // TODO(core): diagnose:start, diagnose:view, diagnose:answer({token, probeId, value}) -> {accepted, done}
  return (
    <DiagnoseView
      view={stubDiagnose(step)}
      busy={false}
      onAnswer={() => setStep((s) => s + 1)}
      onDone={() => router.push("/plan")}
    />
  );
}
