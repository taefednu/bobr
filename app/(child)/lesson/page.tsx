"use client";
import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useT, type Key } from "@/lib/i18n";
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

/** Серая полоска: n клеток, k закрашены. */
function Strip({ value }: { value: string }) {
  const m = /^(\d+)\/(\d+)$/.exec(value);
  const k = m ? Number(m[1]) : 0;
  const n = m ? Number(m[2]) : 0;
  if (!m || n < 1 || n > 24 || k > n) return null;
  const w = 200 / n;
  return (
    <figure className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 200 24" width="200" height="24" role="img" aria-label={value} stroke="var(--color-ink)" strokeWidth="1.5">
        {Array.from({ length: n }, (_, i) => (
          <rect key={i} x={i * w} y="1" width={w} height="22" className={i < k ? "fill-clay-100" : "fill-paper"} />
        ))}
      </svg>
      <figcaption className="text-sm text-ink-muted">{value}</figcaption>
    </figure>
  );
}

/** Числовая прямая 0…max (max — целое ≥ 1): деления по знаменателю первой дроби, точка на каждую дробь. */
function Line({ values }: { values: string[] }) {
  const fr = values.flatMap((v) => {
    const m = /^(\d+)\/(\d+)$/.exec(v);
    return m && Number(m[2]) >= 1 && Number(m[2]) <= 24 ? [{ v, k: Number(m[1]), n: Number(m[2]) }] : [];
  });
  if (!fr.length) return null;
  const max = Math.max(1, ...fr.map(({ k, n }) => Math.ceil(k / n)));
  const den = fr[0].n;
  const x = (k: number, n: number) => 10 + (k / n / max) * 180;
  return (
    <figure className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 200 44" width="240" height="53" role="img" aria-label={values.join(", ")} stroke="var(--color-ink)" strokeWidth="1.5">
        <line x1="10" y1="22" x2="190" y2="22" />
        {Array.from({ length: den * max + 1 }, (_, i) => (
          <line key={i} x1={x(i, den)} y1={i % den === 0 ? 14 : 18} x2={x(i, den)} y2={i % den === 0 ? 30 : 26} />
        ))}
        {fr.map(({ v, k, n }) => <circle key={v} cx={x(k, n)} cy="22" r="5" className="fill-clay-100" />)}
        {Array.from({ length: max + 1 }, (_, i) => (
          <text key={i} x={x(i, 1)} y="42" textAnchor="middle" fontSize="10" stroke="none" className="fill-ink">{i}</text>
        ))}
      </svg>
      <figcaption className="text-sm text-ink-muted">{fr.map(({ v }) => v).join(", ")}</figcaption>
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

  const taskKey = view?.task ? (`lesson.task.${view.task.kind}.${view.task.topic}` as Key) : null;
  const verdict = view?.lastVerdict ? (`lesson.verdict.${view.lastVerdict.split(":")[0]}` as Key) : null;
  const comp = view?.reply?.component;
  const fractions = comp?.params.map((p) => p.value) ?? [];

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
          {verdict && !busy && <p role="status" className="text-base text-ink">{t(verdict)}{view.lastVerdict === "ok" && view.state !== "TOPIC_DONE" ? ` ${t("lesson.next")}` : ""}</p>}
          {view.state === "TOPIC_DONE" && <p role="status" className="text-base text-ink">{t("lesson.done")}</p>}
          {!busy && view.hintLevel > 0 && <p className="border border-ink-muted bg-paper p-3 text-base text-ink">{t(`lesson.hintStep.${Math.min(4, view.hintLevel)}` as Key)}</p>}
          {busy && <p role="status" className="text-base text-ink-muted">{t("lesson.thinking")}</p>}
          {failed && <p role="alert" className="text-base text-ink">{t("lesson.error")}</p>}
          {!busy && view.reply?.text && <p className="border border-ink-muted bg-clay-100 p-3 text-base text-ink">{view.reply.text}</p>}
          {!busy && comp && fractions.length > 0 && (
            <div className="flex flex-wrap gap-4 border border-ink-muted bg-paper p-3">
              {comp.type === "line" ? <Line values={fractions} /> : fractions.map((value, i) => (comp.type === "pie" ? <Pie key={i} value={value} /> : <Strip key={i} value={value} />))}
            </div>
          )}
          {!busy && view.reply?.hintButton && view.hintLevel < 4 && view.state !== "TOPIC_DONE" && (
            <button type="button" className={btn} onClick={() => void send("hint", "")}>{t("lesson.hint")}</button>
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
          <button type="button" className={btn} onClick={() => studentId && void leaveCrisis({ studentId })}>{t("lesson.crisis.back")}</button>
        </div>
      )}
    </>
  );
}
