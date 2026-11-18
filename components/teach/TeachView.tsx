"use client";
// Экран «Научи Bobr»: чистое отображение. Convex, токен и переходы живут в app/(child)/teach/page.tsx.
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Fraction } from "@/components/child/Fraction";
import { NumberLine } from "@/components/fractions/NumberLine";
import { Pie } from "@/components/fractions/Pie";
import { Strip } from "@/components/fractions/Strip";
import { House } from "@/components/mahalla/House";
import { PressButton } from "@/components/ui/press-button";
import { LESSON } from "@/lib/config";
import { useT } from "@/lib/i18n";
import { useMotion } from "@/lib/motion";
import { fill } from "@/lib/ui/fill";
import { BobrHero } from "./BobrHero";
import { CrisisOverlay } from "./CrisisOverlay";
import { lineText, slateTokens, type TeachReply } from "./model";

export type TeachViewProps = {
  reply: TeachReply | null;
  /** starting: Bobr входит в сцену; sending: ждём судью; ready: ребёнок пишет. */
  phase: "starting" | "ready" | "sending";
  /** Номер реплики: растёт на каждый ответ сервера, по нему играет поза. */
  turn: number;
  text: string;
  onText: (v: string) => void;
  onSend: () => void;
  /** Сбой сети или ход отклонён: текст ребёнка остаётся в поле, можно ещё раз. */
  retry: boolean;
  /** Вход в сцену не удался: кнопка «ещё раз» вместо поля. */
  entryFailed: boolean;
  onRetryEntry: () => void;
  onToMahalla: () => void;
  crisis: { text: string; numbers: string[] } | null;
  onLeaveCrisis: () => void;
};

const inkBorder = { border: "var(--stroke-ink) solid var(--color-ink)" } as const;

/** Печатная машинка: текст появляется по буквам; при reduced motion сразу целиком. */
function useTypewriter(text: string | null, off: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (off || !text) return;
    setN(0);
    const id = setInterval(() => setN((v) => (v >= text.length ? (clearInterval(id), v) : v + 1)), 22);
    return () => clearInterval(id);
  }, [text, off]);
  return !text ? "" : off ? text : text.slice(0, n);
}

/** Дом: застроен → оживает (лампа зажигается), когда Bobr научился. */
function LitHouse() {
  const { reduced } = useMotion();
  const [lit, setLit] = useState(reduced);
  useEffect(() => {
    const id = setTimeout(() => setLit(true), 600);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="relative">
      <House state="built" size={180} />
      <motion.div className="absolute inset-0" initial={false} animate={{ opacity: lit || reduced ? 1 : 0 }} transition={{ duration: reduced ? 0 : 0.5 }}>
        <House state="alive" size={180} />
      </motion.div>
    </div>
  );
}

export function TeachView(p: TeachViewProps) {
  const { t } = useT();
  const { reduced, transitions } = useMotion();
  const { reply } = p;
  const thinking = p.phase !== "ready";
  const passed = reply?.beat === "solved";
  const gaveUp = reply?.beat === "give_up";
  const finished = passed || gaveUp;
  const line = lineText(reply, t);
  const shown = useTypewriter(thinking ? null : line, reduced);
  const showRound = reply && (reply.beat === "question" || reply.beat === "wrong_rule") && reply.rounds !== null;
  const demo = gaveUp ? reply?.demo : null;
  const demoValues = demo?.params.map((x) => x.value) ?? [];
  const outcome = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const showOutcome = finished && !thinking;
  // итог (дом ожил) на телефоне ниже экрана: подвести к нему
  useEffect(() => {
    if (showOutcome) outcome.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
  }, [showOutcome, reduced]);
  // новая реплика не должна прятаться под липким полем: подводим к ней с запасом на высоту поля
  useEffect(() => {
    if (!thinking && p.turn > 0) bubble.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
  }, [thinking, p.turn, reduced]);
  const tokens = reply?.attempt && reply.expression ? slateTokens(reply.expression, reply.attempt) : null;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sr-only">{t("teach.title")}</h1>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch lg:gap-10">
        {/* Сцена: Bobr и его решение на дощечке */}
        <section
          className="flex flex-col items-center gap-3 rounded-xl bg-clay-100 px-4 pb-4 pt-4 shadow-rest lg:gap-4 lg:pb-6 lg:pt-8"
          style={inkBorder}
        >
          <BobrHero pose={reply?.pose ?? null} turn={p.turn} thinking={thinking} celebrate={passed} />
          {tokens && (
            <motion.div
              key={`${reply?.beat}-${reply?.attempt}-${reply?.expression}`}
              className="w-full max-w-md rounded-lg bg-paper px-4 py-3 text-center shadow-rest lg:px-5 lg:py-4"
              style={inkBorder}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1, transition: transitions.appear }}
            >
              <p className="text-label text-ink-muted">{t(passed ? "teach.slate.solved" : "teach.slate.attempt")}</p>
              <p className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-numeral font-display">
                {tokens.map((tk, i) => (tk.kind === "frac" ? <Fraction key={i} value={tk.value} /> : <span key={i} className="text-title font-bold">{tk.value}</span>))}
              </p>
            </motion.div>
          )}
        </section>

        {/* Разговор: реплика Bobr, затем поле или итог */}
        <section className="flex flex-col gap-5 lg:justify-start lg:pt-12">
          <div
            ref={bubble}
            aria-live="polite"
            className="relative scroll-mb-52 rounded-lg bg-paper p-4 text-body text-ink shadow-rest lg:p-6 lg:text-title"
            style={inkBorder}
          >
            <svg aria-hidden width="22" height="14" viewBox="0 0 22 14" className="absolute -top-[14px] left-10 lg:hidden" style={{ overflow: "visible" }}>
              <path d="M0 14 L11 0 L22 14 Z" fill="var(--color-paper)" style={{ stroke: "var(--color-ink)", strokeWidth: "var(--stroke-ink)", strokeLinejoin: "round" }} />
              <rect x="-3" y="11" width="28" height="6" fill="var(--color-paper)" />
            </svg>
            <svg aria-hidden width="14" height="22" viewBox="0 0 14 22" className="absolute -left-[14px] top-8 hidden lg:block" style={{ overflow: "visible" }}>
              <path d="M14 0 L0 11 L14 22 Z" fill="var(--color-paper)" style={{ stroke: "var(--color-ink)", strokeWidth: "var(--stroke-ink)", strokeLinejoin: "round" }} />
              <rect x="11" y="2" width="6" height="18" fill="var(--color-paper)" />
            </svg>
            {thinking ? (
              <p aria-hidden className="min-h-[3em] text-ink-muted">…</p>
            ) : (
              <>
                <p className="sr-only">{line}</p>
                <p aria-hidden className="min-h-[3em]">{shown}</p>
              </>
            )}
            {showRound && !thinking && (
              <p className="mt-2 text-label text-ink-muted">{fill(t("teach.round"), { n: String(reply.rounds), max: String(LESSON.bobrQuestionMaxRounds) })}</p>
            )}
          </div>

          {demo && !thinking && demoValues.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-label text-ink-muted">{t("teach.demo")}</p>
              <div className="flex flex-wrap items-end justify-center gap-6">
                {demo.type === "line"
                  ? <NumberLine values={demoValues} />
                  : demoValues.map((value, i) => (demo.type === "pie" ? <Pie key={i} value={value} size={110} /> : <Strip key={i} value={value} />))}
              </div>
            </div>
          )}

          {showOutcome ? (
            <div ref={outcome} className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              {passed && (
                <div className="flex items-center gap-4">
                  <LitHouse />
                  <div>
                    <p className="font-display text-title font-semibold">{t("teach.houseAlive")}</p>
                    {reply?.bobrLevel !== null && reply && <p className="text-body text-ink-muted">{fill(t("teach.bobrLevel"), { n: String(reply.bobrLevel) })}</p>}
                  </div>
                </div>
              )}
              <PressButton onClick={p.onToMahalla} fullWidth={!passed}>{t("plan.toMahalla")}</PressButton>
            </div>
          ) : p.entryFailed ? (
            <div className="flex flex-col gap-3">
              <p role="alert" className="text-body">{t("teach.retry")}</p>
              <PressButton onClick={p.onRetryEntry}>{t("teach.again")}</PressButton>
            </div>
          ) : (
            // липкое поле: на телефоне остаётся над экранной клавиатурой
            <form
              className="sticky bottom-0 -mx-4 flex flex-col gap-2 bg-sand px-4 pb-4 pt-2 lg:static lg:mx-0 lg:bg-transparent lg:p-0"
              onSubmit={(e) => { e.preventDefault(); p.onSend(); }}
            >
              <label htmlFor="teach-text" className="sr-only text-label text-ink-muted lg:not-sr-only">{t("teach.explain.label")}</label>
              {p.retry && <p role="alert" className="text-body">{t("teach.retry")}</p>}
              <textarea
                id="teach-text"
                rows={2}
                value={p.text}
                onChange={(e) => p.onText(e.target.value)}
                placeholder={t("teach.placeholder")}
                autoComplete="off"
                readOnly={p.phase !== "ready"}
                className="w-full resize-none rounded-md bg-paper px-4 py-3 text-body text-ink shadow-[var(--shadow-well)] outline-none placeholder:text-ink-muted focus:[outline:var(--focus-ring)] focus:[outline-offset:var(--focus-offset)] lg:text-title"
                style={inkBorder}
              />
              <PressButton type="submit" disabled={p.phase !== "ready" || !p.text.trim()} fullWidth>{t("teach.send")}</PressButton>
            </form>
          )}
        </section>
      </div>

      {p.crisis && <CrisisOverlay crisis={p.crisis} onLeave={p.onLeaveCrisis} />}
    </div>
  );
}
