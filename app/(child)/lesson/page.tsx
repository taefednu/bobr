"use client";
import { useAction, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { LessonView } from "@/components/lesson/LessonView";
import { useGuard } from "@/lib/ui/session";

export default function Page() {
  const turn = useAction(api.turn.turn);
  const leaveCrisis = useMutation(api.conductor.leaveCrisis);
  const router = useRouter();
  const { token } = useGuard(4, 4);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [answer, setAnswer] = useState("");
  const [text, setText] = useState("");

  const view = useQuery(api.lesson.view, token ? { token } : "skip");

  // Задачи нет (тема не выбрана или токен не признан) — обратно в махаллю.
  useEffect(() => {
    if (token && view !== undefined && !view?.task) router.replace("/mahalla");
  }, [token, view, router]);

  async function send(type: "answer" | "text" | "hint", value: string) {
    if (!token || (type !== "hint" && !value.trim()) || busy) return;
    setBusy(true); // индикатор ожидания — сразу, до ответа сервера (<150 мс)
    setFailed(false);
    try {
      await turn({ token, input: { type, value } });
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <LessonView
      view={token ? view : undefined}
      busy={busy}
      failed={failed}
      answer={answer}
      text={text}
      onAnswerChange={setAnswer}
      onTextChange={setText}
      onSubmitAnswer={() => void send("answer", answer).then(() => setAnswer(""))}
      onSubmitText={() => void send("text", text).then(() => setText(""))}
      onHint={() => void send("hint", "")}
      onStart={() => router.push("/mahalla")}
      onFinish={() => router.push("/mahalla")}
      onLeaveCrisis={() => token && void leaveCrisis({ token })}
    />
  );
}
