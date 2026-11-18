"use client";
import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useT, type Key } from "@/lib/i18n";
import { paramsToRecord } from "@/lib/types";
import { AiBadge, Character } from "@/components/skeleton/Shell";

const STORE = "bobr:lessonStudent";
const btn = "border border-ink-muted bg-paper px-4 py-2 text-base text-ink disabled:text-ink-muted";
const field = "border border-ink-muted bg-paper px-3 py-2 text-base text-ink";

/** Серый круг-пирог: k закрашенных долей из n. Только отображение, числа приходят строкой "k/n" от кода. */
function Pie({ value }: { value: string }) {
  const m = /^(\d+)\/(\d+)$/.exec(value);
  const k = m ? Number(m[1]) : 0;
  const n = m ? Number(m[2]) : 0;
  if (!m || n < 1 || n > 24 || k > n) return null;
  const pt = (i: number) => {
    const a = (2 * Math.PI * i) / n - Math.PI / 2;
    return `${(50 + 45 * Math.cos(a)).toFixed(2)} ${(50 + 45 * Math.sin(a)).toFixed(2)}`;
  };
  return (
    <figure className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 100 100" width="96" height="96" role="img" aria-label={value} stroke="var(--color-ink)" strokeWidth="2">
        {n === 1 ? (
          <circle cx="50" cy="50" r="45" className={k ? "fill-clay-100" : "fill-paper"} />
        ) : (
          Array.from({ length: n }, (_, i) => (
            <path key={i} d={`M50 50 L${pt(i)} A45 45 0 0 1 ${pt(i + 1)} Z`} className={i < k ? "fill-clay-100" : "fill-paper"} />
          ))
        )}
      </svg>
      <figcaption className="text-sm text-ink-muted">{value}</figcaption>
    </figure>
  );
}

function fill(tpl: string | undefined, params: Record<string, string>) {
  return tpl ? tpl.replace(/\{(\w+)\}/g, (_, k: string) => params[k] ?? "") : "";
}

export default function Page() {
  const { t, lang } = useT();
  const start = useMutation(api.conductor.startDemoLesson);
  const turn = useAction(api.turn.turn);
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

  async function send(type: "answer" | "text", value: string) {
    if (!studentId || !value.trim() || busy) return;
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

  const taskKey = view?.task ? (`lesson.task.${view.task.kind}.${view.task.topic}` as Key) : null;
  const verdict = view?.lastVerdict ? (`lesson.verdict.${view.lastVerdict.split(":")[0]}` as Key) : null;
  const comp = view?.reply?.component;
  const pies = comp?.type === "pie" ? Object.entries(paramsToRecord(comp.params)).sort(([a], [b]) => a.localeCompare(b)) : [];

  return (
    <>
      <h1 className="text-xl font-bold">{t("lesson.title")}</h1>
      <Character who="ustoz" state={busy ? "talking" : "idle"} />
      {!view && <button type="button" onClick={begin} className={btn}>{t("lesson.start")}</button>}
      {view?.task && taskKey && (
        <>
          <p className="border border-ink-muted bg-paper p-3">{fill(t(taskKey), view.task.params) || view.task.numbersShown.join(" ")}</p>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void send("answer", answer).then(() => setAnswer("")); }}>
            <input aria-label={t("lesson.answer")} placeholder={t("lesson.answer")} value={answer} onChange={(e) => setAnswer(e.target.value)} className={`${field} min-w-0 flex-1`} />
            <button type="submit" disabled={busy} className={btn}>{t("lesson.check")}</button>
          </form>
          {verdict && !busy && <p role="status" className="text-base text-ink">{t(verdict)}</p>}
          {busy && <p role="status" className="text-base text-ink-muted">{t("lesson.thinking")}</p>}
          {failed && <p role="alert" className="text-base text-ink">{t("lesson.error")}</p>}
          {!busy && view.reply?.text && <p className="border border-ink-muted bg-clay-100 p-3 text-base text-ink">{view.reply.text}</p>}
          {!busy && pies.length > 0 && (
            <div className="flex flex-wrap gap-4 border border-ink-muted bg-paper p-3">
              {pies.map(([k, value]) => <Pie key={k} value={value} />)}
            </div>
          )}
          {!busy && view.reply?.hintButton && (
            <button type="button" className={btn} onClick={() => void send("text", t("lesson.hintRequest"))}>{t("lesson.hint")}</button>
          )}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void send("text", text).then(() => setText("")); }}>
            <input aria-label={t("lesson.askPlaceholder")} placeholder={t("lesson.askPlaceholder")} value={text} onChange={(e) => setText(e.target.value)} className={`${field} min-w-0 flex-1`} />
            <button type="submit" disabled={busy} className={btn}>{t("lesson.ask")}</button>
          </form>
        </>
      )}
      {view?.crisis && (
        <div role="alertdialog" aria-modal="true" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-sand p-6 text-center text-ink">
          <AiBadge />
          <p className="max-w-md text-xl">{view.crisis.text}</p>
          <p className="text-xl font-bold">{t("lesson.crisis.call")} {view.crisis.numbers.join(", ")}</p>
        </div>
      )}
    </>
  );
}
