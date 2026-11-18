"use client";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { PlanView } from "@/components/plan/PlanView";
import { Waiting } from "@/components/v3/onboarding/parts";
import { useGuard } from "@/lib/ui/session";

export default function Page() {
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
      router.push("/home");
    } catch {
      setFailed(true);
    } finally {
      busy.current = false;
    }
  }

  if (!plan) return <Waiting who="ustoz" />;
  return <PlanView plan={plan} failed={failed} onContinue={() => void onContinue()} />;
}
