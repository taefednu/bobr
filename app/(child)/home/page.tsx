"use client";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { HomeView } from "@/components/v3/home/HomeView";
import { useT } from "@/lib/i18n";
import { useGuard } from "@/lib/ui/session";

export default function Page() {
  const { t } = useT();
  const router = useRouter();
  const { token } = useGuard(4, 4);
  const data = useQuery(api.home.view, token ? { token } : "skip");
  const startLesson = useMutation(api.mahalla.startLesson);
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);

  // Урок: HOME → LESSON_SOLVE. «Научи»: тот же старт по теме solved_self, дальше /teach сам входит в сцену.
  async function open(topic: string, to: string) {
    if (!token || busy.current) return;
    busy.current = true;
    setFailed(false);
    try {
      await startLesson({ token, topic });
      router.push(to);
    } catch {
      setFailed(true);
    } finally {
      busy.current = false;
    }
  }

  // Пока данных нет — только каркас без чисел и темы.
  return <HomeView data={data ?? null} onStart={(topic) => void open(topic, "/lesson")} onTeach={(topic) => void open(topic, "/teach")} notice={failed ? t("lesson.error") : null} />;
}
