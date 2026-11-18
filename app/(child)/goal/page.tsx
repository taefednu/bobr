"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoalView } from "@/components/goal/GoalView";
import type { GoalIntent } from "@/lib/ui/demo-data";

export default function Page() {
  const router = useRouter();
  const [intent, setIntent] = useState<GoalIntent | null>(null);
  return (
    <GoalView
      intent={intent}
      onPick={(i) => {
        // TODO(core): goal:set({token, goal})
        setIntent(i);
      }}
      onContinue={() => router.push("/diagnose")}
    />
  );
}
