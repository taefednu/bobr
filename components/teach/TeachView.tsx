"use client";
// Экран «Научи Bobr» в языке v3 (токены --v3-*, Onest, без ink-обводок): чистое отображение. Convex, токен и переходы
// живут в app/(child)/teach/page.tsx. Шапку, раскрытие ИИ и «назад» рисует сам экран: общей шапки у v3-маршрутов нет.
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Character, type Emotion } from "@/components/child/Character";
import { NumberLine } from "@/components/fractions/NumberLine";
import { V3Pie } from "@/components/v3/chat/Pie";
import { Avatar } from "@/components/v3/chat/Bubbles";
import { V3Composer } from "@/components/v3/chat/Composer";
import { IconArrowLeft, V3Card, V3RoundButton, V3Screen } from "@/components/v3";
import { LESSON } from "@/lib/config";
import { useT } from "@/lib/i18n";
import { POSE_ACT, THINKING, useMotion } from "@/lib/motion";
import { fill } from "@/lib/ui/fill";
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
  onBack: () => void;
  crisis: { text: string; numbers: string[] } | null;
  onLeaveCrisis: () => void;
};

const PILL = { background: "linear-gradient(160deg, var(--v3-teal), var(--v3-teal-strong))", color: "var(--v3-on-teal)", boxShadow: "var(--v3-shadow-round)" } as const;
const PILL_CLS = "v3-type-label min-h-12 cursor-pointer rounded-full px-7 transition-transform duration-100 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100";

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

/** Дробь стопкой: числитель, черта, знаменатель. Не дробь («+», «=», «?») — текст. */
function Frac({ value }: { value: string }) {
  const [a, b] = value.split("/");
  return (
    <span role="img" aria-label={value} className="inline-flex flex-col items-center text-[26px] font-extrabold leading-none tabular-nums">
      <span aria-hidden>{a}</span>
      <span aria-hidden className="my-1 block h-[3px] w-full min-w-[1.3em] rounded-full" style={{ background: "var(--v3-ink)" }} />
      <span aria-hidden>{b}</span>
    </span>
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
  const talking = !thinking && !!line && shown.length < line.length;
  const showRound = reply && (reply.beat === "question" || reply.beat === "wrong_rule");
  const demo = gaveUp ? reply?.demo : null;
  const demoValues = demo?.params.map((x) => x.value) ?? [];
  const showOutcome = finished && !thinking;
  const tokens = reply?.attempt && reply.expression ? slateTokens(reply.expression, reply.attempt) : null;
  const emotion = (reply?.pose && reply.pose in POSE_ACT ? reply.pose : "idle") as Emotion;
  const outcome = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const [vh, setVh] = useState<number | null>(null);

  // как в чате: клавиатура сжимает visualViewport, а не dvh, и поле уезжало бы под неё
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const f = () => setVh(vv.height);
    f();
    vv.addEventListener("resize", f);
    return () => vv.removeEventListener("resize", f);
  }, []);
  // итог (дом ожил) может оказаться ниже экрана: подвести к нему
  useEffect(() => {
    if (showOutcome) outcome.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
  }, [showOutcome, reduced]);
  // новая реплика не прячется под полем
  useEffect(() => {
    if (!thinking && p.turn > 0) bubble.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
  }, [thinking, p.turn, reduced]);

  return (
    <V3Screen>
      <div className="flex min-h-0 flex-col overflow-hidden" style={{ height: `calc(${vh ? `${vh}px` : "100dvh"} - env(safe-area-inset-bottom))` }}>
        <header className="flex shrink-0 items-center gap-[22px] pt-[37px]">
          <V3RoundButton label={t("child.back")} size={42} tone="cream" onClick={p.onBack}><IconArrowLeft size={20} /></V3RoundButton>
          <div className="flex min-w-0 flex-1 items-center gap-[13px]">
            <Avatar who="bobr" size={65} />
            <div className="flex min-w-0 flex-col items-start gap-1.5">
              <h1 className="v3-type-name" style={{ lineHeight: "23px" }}>{t("teach.title")}</h1>
              {/* раскрытие ИИ: постоянная строка шапки, не прятать и не уменьшать */}
              <p className="text-[14px] font-medium" style={{ lineHeight: "14px", color: "var(--v3-ink-soft)" }}>{t("chatv3.ai.bobr")}</p>
            </div>
          </div>
        </header>

        <div className="-mx-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 pb-4 pt-8">
          {/* Сцена: Bobr и его решение */}
          <section className="flex flex-col items-center gap-3">
            <Character who="bobr" size={150} emotion={emotion} beat={String(p.turn)} thinking={thinking} talking={talking} lively />
            {tokens && (
              <motion.div
                key={`${reply?.beat}-${reply?.attempt}-${reply?.expression}`}
                className="w-full"
                initial={reduced ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1, transition: transitions.appear }}
              >
                <V3Card tone="circle" className="flex flex-col items-center gap-2 px-5 py-4 text-center">
                  <p className="v3-type-caption" style={{ color: "var(--v3-ink-soft)" }}>{t(passed ? "teach.slate.solved" : "teach.slate.attempt")}</p>
                  <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
                    {tokens.map((tk, i) => (tk.kind === "frac" ? <Frac key={i} value={tk.value} /> : <span key={i} className="v3-type-card">{tk.value}</span>))}
                  </p>
                </V3Card>
              </motion.div>
            )}
          </section>

          {/* Реплика Bobr */}
          <div ref={bubble} className="scroll-mb-24">
          <V3Card tone="ustoz" radius="bubble" aria-live="polite" className="px-5 py-3">
            {thinking ? (
              <p role="status" className="flex h-6 items-center gap-1.5">
                <span className="sr-only">{t("teach.thinking")}</span>
                {[0, 1, 2].map((i) => (
                  <motion.span key={i} aria-hidden className="block size-2.5 rounded-full" style={{ background: "var(--v3-ink-soft)" }}
                    animate={reduced ? undefined : { opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                    transition={{ duration: THINKING.dotPeriodS, repeat: Infinity, delay: i * THINKING.dotStepS, ease: "easeInOut" }} />
                ))}
              </p>
            ) : (
              <>
                <p className="sr-only">{line}</p>
                <p aria-hidden className="v3-type-chat min-h-6">{shown}</p>
              </>
            )}
            {showRound && !thinking && (
              <p className="v3-type-caption mt-2 tabular-nums" style={{ color: "var(--v3-ink-soft)" }}>{fill(t("teach.round"), { n: String(reply.rounds), max: String(LESSON.bobrQuestionMaxRounds) })}</p>
            )}
          </V3Card>
          </div>

          {demo && !thinking && demoValues.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="v3-type-label">{t("teach.demo")}</p>
              <div className="flex flex-wrap items-end justify-center gap-6">
                {demo.type === "line"
                  ? <NumberLine values={demoValues} />
                  : demoValues.map((value, i) => <V3Pie key={i} fraction={value} className="block size-[104px]" />)}
              </div>
            </div>
          )}

          {showOutcome && (
            <div ref={outcome} className="flex flex-col gap-3">
              {passed && (
                <V3Card tone="warm" className="flex items-center gap-4 px-5 py-4">
                  <motion.span aria-hidden className="block size-14 shrink-0 rounded-full" style={{ background: "radial-gradient(in oklch, var(--v3-sun), var(--v3-sun-deep) 70%)", boxShadow: "var(--v3-shadow-card)" }}
                    initial={reduced ? false : { opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1, transition: transitions.pop }} />
                  <div>
                    <p className="v3-type-card">{t("teach.houseAlive")}</p>
                    {reply && <p className="v3-type-caption tabular-nums" style={{ color: "var(--v3-ink-soft)" }}>{fill(t("teach.bobrLevel"), { n: String(reply.bobrLevel) })}</p>}
                  </div>
                </V3Card>
              )}
              <button type="button" onClick={p.onToMahalla} className={`${PILL_CLS} self-stretch`} style={PILL}>{t("plan.toMahalla")}</button>
            </div>
          )}
        </div>

        {!showOutcome && (
          <div className="shrink-0 pb-5 pt-2">
            {p.entryFailed ? (
              <div className="flex flex-col gap-3">
                <p role="alert" className="v3-type-chat">{t("teach.retry")}</p>
                <button type="button" onClick={p.onRetryEntry} className={`${PILL_CLS} self-start`} style={PILL}>{t("teach.again")}</button>
              </div>
            ) : (
              <>
                {p.retry && <p role="alert" className="v3-type-caption mb-2" style={{ color: "var(--v3-ink)" }}>{t("teach.retry")}</p>}
                <V3Composer
                  placeholder={t("teach.placeholder")}
                  pending={p.phase !== "ready"}
                  onSend={() => p.onSend()}
                  controlled={{ value: p.text, onValue: p.onText }}
                />
              </>
            )}
          </div>
        )}
      </div>

      {p.crisis && <CrisisOverlay crisis={p.crisis} onLeave={p.onLeaveCrisis} />}
    </V3Screen>
  );
}
