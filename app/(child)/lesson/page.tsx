"use client";
import { useAction, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { LessonScreen } from "@/components/v3/lesson/LessonScreen";
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
  // Preserve the request ID after a transport failure: retrying must not count
  // the same answer/help twice. The text stays only in this component's memory.
  const pendingRequest = useRef<{ key: string; id: string; taskInstanceId?: Id<"taskProgress"> } | null>(null);
  const inFlight = useRef(false);

  const view = useQuery(api.lesson.view, token ? { token } : "skip");

  // Задачи нет (тема не выбрана или токен не признан) — обратно в махаллю.
  useEffect(() => {
    if (token && view !== undefined && !view?.task) router.replace("/home");
  }, [token, view, router]);

  async function send(type: "answer" | "text" | "hint", value: string) {
    if (!token || (type !== "hint" && !value.trim()) || inFlight.current) return false;
    const key = JSON.stringify([type, value]);
    if (pendingRequest.current?.key !== key) {
      const hex = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
      pendingRequest.current = {
        key, id: `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`,
        taskInstanceId: view?.socratic?.taskInstanceId,
      };
    }
    const { taskInstanceId } = pendingRequest.current;
    inFlight.current = true;
    setBusy(true); // индикатор ожидания — сразу, до ответа сервера (<150 мс)
    setFailed(false);
    try {
      const result = await turn({ token, input: {
        type, value,
        ...(taskInstanceId ? { taskInstanceId, requestId: pendingRequest.current.id } : {}),
      } });
      if (result.status === "rejected") {
        pendingRequest.current = null;
        setFailed(true);
        return false;
      }
      pendingRequest.current = null;
      return true;
    } catch {
      setFailed(true);
      return false;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <LessonScreen
      view={token ? view : undefined}
      busy={busy}
      failed={failed}
      answer={answer}
      text={text}
      onAnswerChange={setAnswer}
      onTextChange={setText}
      onSubmitAnswer={() => void send("answer", answer).then((sent) => { if (sent) setAnswer(""); })}
      onSubmitText={() => void send("text", text).then((sent) => { if (sent) setText(""); })}
      onHint={() => void send("hint", "")}
      onStart={() => router.push("/home")}
      onFinish={() => router.push("/house")}
      onBack={() => router.push("/house")}
      onLeaveCrisis={() => token && void leaveCrisis({ token })}
    />
  );
}
