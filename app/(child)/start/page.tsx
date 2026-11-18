"use client";
// Раскрытие ИИ: ребёнок сам читает и нажимает. Согласие не ставится само.
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { StartView } from "@/components/v3/onboarding/StartView";
import { Waiting } from "@/components/v3/onboarding/parts";
import { useGuard } from "@/lib/ui/session";

export default function Page() {
  const router = useRouter();
  const accept = useMutation(api.session.acceptConsent);
  const { token, ready } = useGuard(0, 0);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!ready) return <Waiting who="bobr" />;

  async function go() {
    if (!token || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await accept({ token });
      router.push("/goal");
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return <StartView busy={busy} failed={failed} onAccept={() => void go()} />;
}
