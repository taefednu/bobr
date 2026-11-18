"use client";
import { useAction, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { V3Screen } from "@/components/v3";
import { GoalView } from "@/components/goal/GoalView";
import { useGuard } from "@/lib/ui/session";
import type { GoalIntent } from "@/lib/ui/types";

export default function Page() {
  const router = useRouter();
  const setGoal = useMutation(api.goal.set);
  const { token, ready } = useGuard(1, 1);
  const [intent, setIntent] = useState<GoalIntent | null>(null);
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);
  const goalLine = useAction(api.goalDialog.line);
  const [line, setLine] = useState<string | null>(null);

  // Живая фраза не блокирует выбор цели: кнопки видны сразу, любой сбой оставляет goal.ask.
  useEffect(() => {
    if (!token) return;
    let alive = true;
    goalLine({ token }).then((r) => alive && setLine(r.reply), () => undefined);
    return () => { alive = false; };
  }, [token, goalLine]);

  if (!ready) return <V3Screen><span /></V3Screen>;

  async function save() {
    if (!token || !intent || busy.current) return;
    busy.current = true;
    setFailed(false);
    try {
      await setGoal({ token, goal: intent });
      router.push("/diagnose");
    } catch {
      setFailed(true);
    } finally {
      busy.current = false;
    }
  }

  return <GoalView line={line} failed={failed} intent={intent} onPick={setIntent} onContinue={() => void save()} />;
}
