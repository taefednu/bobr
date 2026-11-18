"use client";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { CharacterSays } from "@/components/child/CharacterSays";
import { MahallaView } from "@/components/mahalla/MahallaView";
import { useT } from "@/lib/i18n";
import { useGuard } from "@/lib/ui/session";
import type { MahallaView as View } from "@/lib/ui/types";

export default function Page() {
  const { t } = useT();
  const router = useRouter();
  const startLesson = useMutation(api.mahalla.startLesson);
  const { token } = useGuard(4, 4);
  const view = useQuery(api.mahalla.view, token ? { token } : "skip");
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);

  async function onStart(topic: string) {
    if (!token || busy.current) return;
    busy.current = true;
    setFailed(false);
    try {
      await startLesson({ token, topic });
      router.push("/lesson");
    } catch {
      setFailed(true);
    } finally {
      busy.current = false;
    }
  }

  if (!view) return <CharacterSays who="bobr" thinking />;
  return (
    <>
      <MahallaView view={view as View} onStart={(topic) => void onStart(topic)} />
      {failed && <p role="alert" className="text-body text-ink">{t("lesson.error")}</p>}
    </>
  );
}
