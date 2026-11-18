"use client";
// Экран урока в языке v3 (эталон шапки и пузырей: 3-chat.png). Чистое отображение: Convex, токен и send живут в
// app/(child)/lesson/page.tsx, а /dev/v3/lesson рисует тот же компонент на фикстурах. Все числа и вердикты приходят от сервера.
import { Fragment, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { MAX_LEN } from "@/components/chat/model";
import type { LessonViewData, LessonViewProps } from "@/components/lesson/LessonView";
import { IconArrowLeft, V3Card, V3RoundButton, V3Screen, V3Sheet } from "@/components/v3";
import { Avatar, V3Bubble, V3Typing } from "@/components/v3/chat/Bubbles";
import type { Key } from "@/lib/i18n";
import { useT } from "@/lib/i18n";
import { useMotion } from "@/lib/motion";
import { fill } from "@/lib/ui/fill";
import { V3Crisis, V3Fraction, V3LessonLine, V3LessonPie, V3LessonStrip, V3Pill } from "./parts";

export type LessonScreenProps = LessonViewProps & { onBack: () => void };

/** Числа задачи рядом с предложением (формы params — как у генератора). Ответ в строку не попадает:
 *  одиночное num/den (N2) и есть ответ, его не показываем; N5 с toDen показывает исходную дробь. */
function taskFractions(p: Record<string, string>): string[] {
  if (p.a && p.b && p.c && p.d) return [`${p.a}/${p.b}`, `${p.c}/${p.d}`];
  if (p.a && p.c && p.den) return [`${p.a}/${p.den}`, `${p.c}/${p.den}`];
  if (p.a && p.b) return [p.a, p.b]; // N6: два числа
  if (p.num && p.den && p.toDen && p.toDen !== p.den) return [`${p.num}/${p.den}`];
  return [];
}

type Task = NonNullable<LessonViewData["task"]>;

export function LessonScreen(p: LessonScreenProps) {
  const { t } = useT();
  const router = useRouter();
  const { reduced, transitions, targets } = useMotion();
  const [askOpen, setAskOpen] = useState(false);
  const { view, busy } = p;

  const loading = busy || view === undefined;
  const task: Task | null = view?.task ?? null;
  const taskKey = task ? (`lesson.task.${task.kind}.${task.topic}` as Key) : null;
  const verdict = view?.lastVerdict ? (`lesson.verdict.${view.lastVerdict.split(":")[0]}` as Key) : null;
  const comp = view?.reply?.component;
  const fractions = comp?.params.map((x) => x.value) ?? [];
  // Рисунок-условие (задача вида picture) приходит с сервера отдельно от реплики; поле шире общего типа LessonViewData.
  const pic = (view as (LessonViewData & { picture?: { type: "pie" | "strip" | "line"; cells: { k: number; n: number }[] } | null }) | null | undefined)?.picture ?? null;
  const picValues = pic?.cells.map(({ k, n }) => `${k}/${n}`) ?? [];
  const showComp = !busy && !!comp && fractions.length > 0 && !(pic && comp.type === pic.type && fractions.join() === picValues.join());
  const bubble = loading ? null : (view?.reply?.text ?? null);
  const done = view?.state === "TOPIC_DONE";
  const showNext = view?.lastVerdict === "ok" && !done;
  const punch = view?.lastVerdict === "ok" && !busy && !reduced;
  const teach = !!task && !!view?.canTeach;
  const solving = !!task && !!taskKey && !view?.canTeach;
  const showHintBtn = !busy && !!view && (view.socratic ? view.state === "LESSON_SOLVE" : !!view.reply?.hintButton && view.hintLevel < 4);
  const showHintStep = solving && !busy && !view?.socratic && (view?.hintLevel ?? 0) > 0;
  const nums = task ? taskFractions(task.params) : [];

  return (
    <V3Screen>
      <div className="flex min-h-dvh flex-col pb-5">
        <header className="flex shrink-0 items-center gap-[18px] pt-[37px]">
          <V3RoundButton data-ref="back" label={t("lessonv3.back")} size={42} tone="cream" onClick={p.onBack}><IconArrowLeft size={20} /></V3RoundButton>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar who="ustoz" size={56} dataRef="avatar" />
            <div className="flex min-w-0 flex-col items-start gap-1">
              <p data-ref="name" className="v3-type-section" style={{ lineHeight: "24px" }}>{t("char.ustoz")}</p>
              {/* раскрытие ИИ: постоянная строка шапки, не прятать и не уменьшать */}
              <p data-ref="sub" className="text-[14px] font-medium" style={{ lineHeight: "16px", color: "var(--v3-ink-soft)" }}>{t("chatv3.ai.ustoz")}</p>
            </div>
          </div>
        </header>
        <h1 className="sr-only">{t("lesson.title")}</h1>

        <div className="flex flex-1 flex-col gap-4 pt-6">
          {view === null && (
            <div className="flex flex-1 items-center justify-center">
              <img src="/v3/cat-ustoz.png" alt="" aria-hidden width={170} height={170} draggable={false} className="size-[170px] select-none" />
            </div>
          )}

          {teach && (
            <V3Card tone="warm" className="overflow-hidden pl-5 pt-5" data-ref="teach">
              <div className="flex items-end gap-2">
                <p className="v3-type-card min-w-0 flex-1 pb-5">{t("lesson.teach.lead")}</p>
                <img src="/v3/card-bobr.png" alt="" aria-hidden width={756} height={508} draggable={false} className="h-auto w-[150px] shrink-0 select-none" />
              </div>
            </V3Card>
          )}

          {solving && task && taskKey && (
            <V3Card className="flex flex-col gap-4 p-5" data-ref="task">
              {showNext && <p className="v3-type-caption" style={{ color: "var(--v3-ink-soft)" }}>{t("lesson.next")}</p>}
              <p className="v3-type-card">{fill(t(taskKey), task.params) || task.numbersShown.join(" ")}</p>
              {nums.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 py-1">
                  {nums.map((f, i, all) => (
                    <Fragment key={`${f}-${i}`}>
                      {i > 0 && all.length === 2 && !!task.params.c && <span aria-hidden className="text-[28px] font-extrabold" style={{ color: "var(--v3-ink-soft)" }}>+</span>}
                      <V3Fraction value={f} />
                    </Fragment>
                  ))}
                </div>
              )}
              {pic && picValues.length > 0 && (
                <div className="flex flex-wrap items-end justify-center gap-x-6 gap-y-4" data-ref="picture">
                  {pic.type === "line"
                    ? <V3LessonLine values={picValues} />
                    : picValues.map((value, i) => (
                        <div key={`${value}-${i}`} className="flex flex-col items-center">
                          {pic.type === "pie" ? <V3LessonPie value={value} /> : <V3LessonStrip value={value} />}
                        </div>
                      ))}
                </div>
              )}
              {showComp && comp && (
                <div className="flex flex-wrap items-end justify-center gap-x-6 gap-y-4" data-ref="visual">
                  {comp.type === "line"
                    ? <V3LessonLine values={fractions} />
                    : fractions.map((value, i) => (
                        // только рисунок: подпись дробью здесь могла бы показать ответ задачи
                        <div key={`${value}-${i}`} className="flex flex-col items-center">
                          {comp.type === "pie" ? <V3LessonPie value={value} /> : <V3LessonStrip value={value} />}
                        </div>
                      ))}
                </div>
              )}
            </V3Card>
          )}

          {/* вердикт: спокойная плашка без красного; ok — бирюзовая точка, остальное — янтарная */}
          {verdict && !busy && (
            <motion.p role="status" data-ref="verdict" initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: transitions.appear }} className="v3-type-label flex items-center gap-2.5 self-start rounded-full py-2 pl-4 pr-5" style={{ background: view?.lastVerdict === "ok" ? "var(--v3-avatar)" : "var(--v3-note)", boxShadow: "var(--v3-shadow-card)" }}>
              <motion.span aria-hidden className="size-2.5 shrink-0 rounded-full" initial={reduced || view?.lastVerdict !== "ok" ? false : { scale: 0.4 }} animate={{ scale: 1, transition: transitions.pop }} style={{ background: view?.lastVerdict === "ok" ? "var(--v3-teal-strong)" : "var(--v3-sun-deep)" }} />
              {t(verdict)}
            </motion.p>
          )}

          {(loading || bubble || done) && (
            <ul className="m-0 flex list-none flex-col gap-3 p-0" data-ref="ustoz">
              {loading && <V3Typing who="ustoz" label={t("lesson.thinking")} />}
              {bubble && <V3Bubble key={bubble} role="ustoz" text={bubble} label={t("char.ustoz")} fresh />}
              {done && !loading && <V3Bubble key="done" role="ustoz" text={t("lesson.done")} label={t("char.ustoz")} fresh />}
            </ul>
          )}

          {showHintStep && task && (
            <V3Card tone="note" radius="stat" className="flex flex-col gap-1 px-5 py-4" data-ref="hintStep">
              <p className="v3-type-label">{t("lesson.hint")}</p>
              <p className="v3-type-chat">{t(`lesson.hintStep.${task.topic}.${Math.min(4, view!.hintLevel)}` as Key) ?? t(`lesson.hintStep.${Math.min(4, view!.hintLevel)}` as Key)}</p>
            </V3Card>
          )}

          {p.failed && (
            <V3Card tone="note" radius="stat" className="px-5 py-4"><p role="alert" className="v3-type-chat">{t("lesson.error")}</p></V3Card>
          )}
        </div>

        {/* один экран — одно главное действие: нижняя кнопка */}
        <div className="mt-auto flex flex-col gap-3 pt-5">
          {view === null && <V3Pill dataRef="start" onClick={p.onStart}>{t("lesson.start")}</V3Pill>}

          {teach && (
            <>
              <V3Pill dataRef="teach-cta" onClick={() => router.push("/teach")}>{t("lesson.teach.cta")}</V3Pill>
              <div className="flex justify-center"><V3Pill tone="soft" onClick={p.onFinish}>{t("lessonv3.toHouse")}</V3Pill></div>
            </>
          )}

          {solving && done && <V3Pill dataRef="house" onClick={p.onFinish}>{t("lessonv3.toHouse")}</V3Pill>}

          {solving && !done && task && (
            <>
              <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); p.onSubmitAnswer(); }}>
                <motion.div
                  key={view?.lastVerdict === "ok" ? `ok-${view.hintLevel}-${task.numbersShown.join()}` : "idle"}
                  initial={punch ? { scale: targets.punchScale } : false}
                  animate={{ scale: 1, transition: transitions.punch }}
                >
                  <input
                    data-ref="answer"
                    aria-label={t("lesson.answer")}
                    placeholder={t("lesson.answer")}
                    value={p.answer}
                    onChange={(e) => p.onAnswerChange(e.target.value)}
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    className="block h-16 w-full min-w-0 rounded-[28px] tabular-nums px-5 text-center outline-none placeholder:text-[color:var(--v3-ink-soft)] placeholder:opacity-80 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[color:var(--v3-teal-strong)]"
                    style={{ background: "var(--v3-field)", boxShadow: "var(--v3-shadow-card)", color: "var(--v3-ink)", font: p.answer ? "800 26px/1 var(--font-sans)" : "var(--v3-type-chat)" }}
                  />
                </motion.div>
                <V3Pill type="submit" dataRef="check" disabled={busy}>{t("lesson.check")}</V3Pill>
              </form>

              <div className="flex flex-wrap items-center justify-center gap-[9px]">
                {showHintBtn && <V3Pill tone="soft" dataRef="hint" onClick={p.onHint}>{t("lesson.hint")}</V3Pill>}
                <V3Pill tone="soft" dataRef="ask" disabled={busy} onClick={() => setAskOpen(true)}>{t("lesson.ask")}</V3Pill>
              </div>
              {showHintBtn && view?.socratic && <p className="v3-type-caption text-center" style={{ color: "var(--v3-ink-soft)" }}>{t("lesson.hintControl")}</p>}
            </>
          )}
        </div>
      </div>

      <V3Sheet open={askOpen} onClose={() => setAskOpen(false)} title={t("lesson.ask")}>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!p.text.trim() || busy) return;
            p.onSubmitText();
            setAskOpen(false);
          }}
        >
          <input
            data-autofocus
            data-ref="askInput"
            aria-label={t("lesson.askPlaceholder")}
            placeholder={t("lesson.askPlaceholder")}
            value={p.text}
            maxLength={MAX_LEN}
            onChange={(e) => p.onTextChange(e.target.value)}
            autoComplete="off"
            className="v3-type-chat block h-14 w-full min-w-0 rounded-[28px] px-5 outline-none placeholder:text-[color:var(--v3-ink-soft)] placeholder:opacity-80 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[color:var(--v3-teal-strong)]"
            style={{ background: "var(--v3-field)", boxShadow: "var(--v3-shadow-card)", color: "var(--v3-ink)" }}
          />
          <V3Pill type="submit" dataRef="send" disabled={busy || !p.text.trim()}>{t("lessonv3.send")}</V3Pill>
        </form>
      </V3Sheet>

      {view?.crisis && <V3Crisis crisis={view.crisis} onLeave={p.onLeaveCrisis} />}
    </V3Screen>
  );
}
