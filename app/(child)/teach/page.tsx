"use client";
// «Научи Bobr»: вход (start) из урока и после перезагрузки посреди сцены, ходы ребёнка (explain). Токен ребёнка, не studentId.
import { useAction, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { TeachView } from "@/components/teach/TeachView";
import type { TeachReply } from "@/components/teach/model";
import { useGuard } from "@/lib/ui/session";

// Состояния, где сцену можно войти заново (start с solved_self). Всё прочее — обратно в урок.
const SCENE = ["LESSON_SOLVE", "TOPIC_DONE", "TEACH_BOBR", "BOBR_QUESTION", "BOBR_ATTEMPT", "JUDGING"];

export default function Page() {
  const router = useRouter();
  const { token } = useGuard(4, 4);
  const start = useAction(api.teach.start);
  const explain = useAction(api.teach.explain);
  const leaveCrisis = useMutation(api.conductor.leaveCrisis);
  const view = useQuery(api.lesson.view, token ? { token } : "skip");

  const [reply, setReply] = useState<TeachReply | null>(null);
  const [phase, setPhase] = useState<"starting" | "ready" | "sending">("starting");
  const [turn, setTurn] = useState(0);
  const [text, setText] = useState("");
  const [retry, setRetry] = useState(false);
  const [entryFailed, setEntryFailed] = useState(false);
  const entering = useRef(false);

  const topic = view?.task?.topic ?? null;
  const canEnter = !!view && !view.crisis && view.canTeach && !!topic;

  async function enter() {
    if (!token || !topic || entering.current) return;
    entering.current = true;
    setEntryFailed(false);
    setPhase("starting");
    try {
      const r = await start({ token, topic });
      if (r.status === "replied") {
        setReply(r);
        setTurn((n) => n + 1);
      } else if (r.status !== "crisis") router.replace("/lesson"); // сцену не войти: урок покажет, что делать
    } catch {
      setEntryFailed(true);
    } finally {
      entering.current = false;
      setPhase("ready");
    }
  }

  // Первый заход и перезагрузка посреди сцены: сцену можно начать заново, иначе — в урок.
  useEffect(() => {
    if (!token || !view || reply || entering.current || entryFailed || view.crisis) return;
    if (canEnter) void enter();
    else if (!SCENE.includes(view.state) || !view.canTeach) router.replace("/lesson");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- enter читает те же token/topic
  }, [token, view, reply, canEnter, entryFailed, router]);

  async function send() {
    const value = text.trim();
    if (!token || !value || phase !== "ready") return;
    setPhase("sending"); // Bobr начинает думать сразу, до ответа сервера
    setRetry(false);
    try {
      const r = await explain({ token, value });
      if (r.status === "replied") {
        setReply(r);
        setTurn((n) => n + 1);
        setText("");
      } else if (r.status === "copied") {
        setReply(r); // «своими словами»: текст остаётся, чтобы переписать
        setTurn((n) => n + 1);
      } else if (r.status === "retry") {
        setReply(r);
        setTurn((n) => n + 1);
        setRetry(true);
      } else if (r.status !== "crisis") setRetry(true); // rejected / stale: текст остаётся, Bobr ждёт
    } catch {
      setRetry(true);
    } finally {
      setPhase("ready");
    }
  }

  return (
    <TeachView
      reply={reply}
      phase={token && view !== undefined ? phase : "starting"}
      turn={turn}
      text={text}
      onText={setText}
      onSend={() => void send()}
      retry={retry}
      entryFailed={entryFailed}
      onRetryEntry={() => void enter()}
      onToMahalla={() => router.push("/mahalla")}
      crisis={view?.crisis ?? null}
      onLeaveCrisis={() => token && void leaveCrisis({ token })}
    />
  );
}
