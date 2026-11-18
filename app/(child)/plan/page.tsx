"use client";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { CharacterSays } from "@/components/child/CharacterSays";
import { PlanView } from "@/components/plan/PlanView";
import { useT } from "@/lib/i18n";
import { useGuard } from "@/lib/ui/session";

export default function Page() {
  const { t } = useT();
  const router = useRouter();
  const accept = useMutation(api.plan.accept);
  const { token, me } = useGuard(3, 4);
  const plan = useQuery(api.plan.view, token ? { token } : "skip");
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);

  async function onContinue() {
    if (!token || busy.current) return;
    busy.current = true;
    setFailed(false);
    try {
      if (me?.state === "PLAN") await accept({ token });
      router.push("/mahalla");
    } catch {
      setFailed(true);
    } finally {
      busy.current = false;
    }
  }

  if (!plan) return <CharacterSays who="ustoz"><p role="status" className="text-ink-muted">{t("diagnose.thinking")}</p></CharacterSays>;
  return (
    <>
      <PlanView plan={plan} onContinue={() => void onContinue()} />
      {failed && <p role="alert" className="text-body text-ink">{t("lesson.error")}</p>}
    </>
  );
}
