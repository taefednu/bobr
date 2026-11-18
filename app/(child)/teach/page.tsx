"use client";
// «Научи Bobr»: вход (start) из урока и после перезагрузки посреди сцены, ходы ребёнка (explain). Только токен ребёнка.
import { useAction, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { TeachView } from "@/components/teach/TeachView";
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
  const scene = useQuery(api.teach.scene, token ? { token } : "skip"); // undefined — грузится, null — сцены нет
  const reply = scene ?? null;

  const [phase, setPhase] = useState<"starting" | "ready" | "sending">("starting");
  const [text, setText] = useState("");
  const [retry, setRetry] = useState(false);
  const [entryFailed, setEntryFailed] = useState(false);
  const entering = useRef(false);

  const shownPhase = token && view !== undefined && scene !== undefined ? (reply && phase === "starting" ? "ready" : phase) : "starting";
  const topic = view?.task?.topic ?? null;
  const canEnter = !!view && !view.crisis && view.canTeach && !!topic;

  async function enter() {
    if (!token || !topic || entering.current) return;
    entering.current = true;
    setEntryFailed(false);
    setPhase("starting");
    try {
      const r = await start({ token, topic });
      if (r.status !== "replied" && r.status !== "crisis") router.replace("/lesson"); // сцену не войти: урок покажет, что делать
    } catch {
      setEntryFailed(true);
    } finally {
      entering.current = false;
      setPhase("ready");
    }
  }

  // Первый заход и перезагрузка посреди сцены: сцену можно начать заново, иначе — в урок.
  useEffect(() => {
    if (!token || !view || scene === undefined || reply || entering.current || entryFailed || view.crisis) return;
    if (canEnter) void enter();
    else if (!SCENE.includes(view.state) || !view.canTeach) router.replace("/lesson");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- enter читает те же token/topic
  }, [token, view, scene, reply, canEnter, entryFailed, router]);

  async function send() {
    const value = text.trim();
    if (!token || !value || shownPhase !== "ready") return;
    setPhase("sending"); // Bobr начинает думать сразу, до ответа сервера
    setRetry(false);
    try {
      const r = await explain({ token, value });
      // реплика и поза придут через useQuery; здесь только поле ввода
      if (r.status === "replied") setText("");
      else if (r.status === "retry") setRetry(true); // copied: «своими словами», текст остаётся, чтобы переписать
      else if (r.status !== "copied" && r.status !== "crisis") setRetry(true); // rejected / stale: текст остаётся, Bobr ждёт
    } catch {
      setRetry(true);
    } finally {
      setPhase("ready");
    }
  }

  return (
    <TeachView
      reply={reply}
      phase={shownPhase}
      turn={reply?.turnNo ?? 0}
      text={text}
      onText={setText}
      onSend={() => void send()}
      retry={retry}
      entryFailed={entryFailed}
      onRetryEntry={() => void enter()}
      onToMahalla={() => router.push("/home")}
      onBack={() => router.push("/lesson")}
      crisis={view?.crisis ?? null}
      onLeaveCrisis={() => token && void leaveCrisis({ token })}
    />
  );
}
