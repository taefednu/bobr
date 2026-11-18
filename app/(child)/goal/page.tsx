"use client";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { CharacterSays } from "@/components/child/CharacterSays";
import { GoalView } from "@/components/goal/GoalView";
import { useT } from "@/lib/i18n";
import { useGuard } from "@/lib/ui/session";
import type { GoalIntent } from "@/lib/ui/types";

export default function Page() {
  const { t } = useT();
  const router = useRouter();
  const setGoal = useMutation(api.goal.set);
  const { token, ready } = useGuard(1, 1);
  const [intent, setIntent] = useState<GoalIntent | null>(null);
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);

  if (!ready) return <CharacterSays who="bobr" thinking />;

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

  return (
    <>
      <GoalView intent={intent} onPick={setIntent} onContinue={() => void save()} />
      {failed && <p role="alert" className="text-body text-ink">{t("lesson.error")}</p>}
    </>
  );
}
