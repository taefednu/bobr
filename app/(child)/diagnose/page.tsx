"use client";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { CharacterSays } from "@/components/child/CharacterSays";
import { DiagnoseView } from "@/components/diagnose/DiagnoseView";
import { useT } from "@/lib/i18n";
import { useGuard } from "@/lib/ui/session";
import type { DiagnoseView as View } from "@/lib/ui/types";

export default function Page() {
  const { t } = useT();
  const router = useRouter();
  const start = useMutation(api.diagnose.start);
  const answer = useMutation(api.diagnose.answer);
  const { token, me, ready } = useGuard(2, 3);
  const view = useQuery(api.diagnose.view, token ? { token } : "skip");
  const started = useRef(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const inDiagnose = ready && me?.state === "DIAGNOSE";
  useEffect(() => {
    if (!token || !inDiagnose || started.current) return;
    started.current = true; // идемпотентно на сервере, но одного вызова достаточно
    start({ token }).catch(() => {
      started.current = false;
      setFailed(true);
    });
  }, [token, inDiagnose, start]);

  async function onAnswer(probeId: string, value: string) {
    if (!token || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await answer({ token, probeId, value });
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  // Пробы ещё нет (до start) — это не «готово»: готово только в PLAN.
  if (!view || (!view.probe && view.state !== "PLAN")) {
    return (
      <>
        <CharacterSays who="ustoz"><p role="status" className="text-ink-muted">{t("diagnose.thinking")}</p></CharacterSays>
        {failed && <p role="alert" className="text-body text-ink">{t("lesson.error")}</p>}
      </>
    );
  }

  return (
    <>
      <DiagnoseView view={view as View} busy={busy} onAnswer={(id, v) => void onAnswer(id, v)} onDone={() => router.push("/plan")} />
      {failed && <p role="alert" className="text-body text-ink">{t("lesson.error")}</p>}
    </>
  );
}
