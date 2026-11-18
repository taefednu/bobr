"use client";
import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useT } from "@/lib/i18n";
import { LessonView } from "@/components/lesson/LessonView";

const STORE = "bobr:lessonStudent";

export default function Page() {
  const { lang } = useT();
  const start = useMutation(api.conductor.startDemoLesson);
  const turn = useAction(api.turn.turn);
  const leaveCrisis = useMutation(api.conductor.leaveCrisis);
  const [studentId, setStudentId] = useState<Id<"students"> | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [answer, setAnswer] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    try {
      const id = localStorage.getItem(STORE);
      if (id) setStudentId(id as Id<"students">);
    } catch {}
  }, []);

  const view = useQuery(api.lesson.view, studentId ? { studentId } : "skip");

  async function send(type: "answer" | "text" | "hint", value: string) {
    if (!studentId || (type !== "hint" && !value.trim()) || busy) return;
    setBusy(true); // индикатор ожидания — сразу, до ответа сервера (<150 мс)
    setFailed(false);
    try {
      await turn({ studentId, input: { type, value } });
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  async function begin() {
    const id = await start({ lang });
    try {
      localStorage.setItem(STORE, id);
    } catch {}
    setStudentId(id);
  }

  return (
    <LessonView
      view={view}
      busy={busy}
      failed={failed}
      answer={answer}
      text={text}
      onAnswerChange={setAnswer}
      onTextChange={setText}
      onSubmitAnswer={() => void send("answer", answer).then(() => setAnswer(""))}
      onSubmitText={() => void send("text", text).then(() => setText(""))}
      onHint={() => void send("hint", "")}
      onStart={() => void begin()}
      onLeaveCrisis={() => studentId && void leaveCrisis({ studentId })}
    />
  );
}
