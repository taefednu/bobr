"use client";
// Раскрытие ИИ: ребёнок сам читает и нажимает. Согласие не ставится само.
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { CharacterSays } from "@/components/child/CharacterSays";
import { PressButton } from "@/components/ui/press-button";
import { useT } from "@/lib/i18n";
import { useGuard } from "@/lib/ui/session";

export default function Page() {
  const { t } = useT();
  const router = useRouter();
  const accept = useMutation(api.session.acceptConsent);
  const { token, ready } = useGuard(0, 0);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!ready) return <CharacterSays who="bobr" thinking />;

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

  return (
    <div className="flex flex-col gap-6 sm:pt-[8vh]">
      <h1 className="font-display text-title font-bold">{t("consent.title")}</h1>
      <CharacterSays who="bobr">{t("consent.body")}</CharacterSays>
      {failed && <p role="alert" className="text-body text-ink">{t("lesson.error")}</p>}
      <PressButton fullWidth disabled={busy} onClick={() => void go()}>{t("consent.accept")}</PressButton>
    </div>
  );
}
