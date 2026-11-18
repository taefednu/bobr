"use client";
// Экран урока: чистое отображение. Convex, localStorage и send живут в app/(child)/lesson/page.tsx.
import { Fragment } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Card } from "@/components/child/Card";
import { Character } from "@/components/child/Character";
import { CharacterSays } from "@/components/child/CharacterSays";
import { Fraction } from "@/components/child/Fraction";
import { NumberLine } from "@/components/fractions/NumberLine";
import { Pie } from "@/components/fractions/Pie";
import { Strip } from "@/components/fractions/Strip";
import { CrisisOverlay } from "@/components/teach/CrisisOverlay";
import { PressButton } from "@/components/ui/press-button";
import type { Key } from "@/lib/i18n";
import { useT } from "@/lib/i18n";
import { useMotion } from "@/lib/motion";
import { fill } from "@/lib/ui/fill";

/** Форма ответа convex/lessonView.ts (публичная проекция, без answer и distractors). */
export type LessonViewData = {
  state: string;
  lastVerdict: string | null;
  hintLevel: number;
  /** Сервер решил: тема решена сама, можно учить Bobr. Клиент уровень не выводит. Необязательное: dev-фикстуры без него. */
  canTeach?: boolean;
  task: { topic: string; kind: string; params: Record<string, string>; numbersShown: string[] } | null;
  reply: {
    text: string | null;
    component: { type: "pie" | "strip" | "line"; params: { key: string; value: string }[] } | null;
    hintButton: boolean;
  } | null;
  crisis: { text: string; numbers: string[] } | null;
};

export type LessonViewProps = {
  view: LessonViewData | null | undefined;
  busy: boolean;
  failed: boolean;
  answer: string;
  text: string;
  onAnswerChange: (v: string) => void;
  onTextChange: (v: string) => void;
  onSubmitAnswer: () => void;
  onSubmitText: () => void;
  onHint: () => void;
  onStart: () => void;
  onLeaveCrisis: () => void;
  onFinish: () => void;
};

/** Числа задачи столбиком рядом с предложением (формы params — как у генератора). Ответ в строку не попадает:
 *  одиночное num/den (N2) и есть ответ, его не показываем; N5 с toDen показывает исходную дробь. */
function taskFractions(p: Record<string, string>): string[] {
  if (p.a && p.b && p.c && p.d) return [`${p.a}/${p.b}`, `${p.c}/${p.d}`];
  if (p.a && p.c && p.den) return [`${p.a}/${p.den}`, `${p.c}/${p.den}`];
  if (p.a && p.b) return [p.a, p.b]; // N6: два числа
  if (p.num && p.den && p.toDen && p.toDen !== p.den) return [`${p.num}/${p.den}`];
  return [];
}

const inputBase =
  "min-w-0 w-full rounded-md bg-paper text-ink shadow-[var(--shadow-well)] outline-none placeholder:text-ink-muted focus:[outline:var(--focus-ring)] focus:[outline-offset:var(--focus-offset)]";
const inkBorder = { border: "var(--stroke-ink) solid var(--color-ink)" } as const;

export function LessonView(p: LessonViewProps) {
  const { t } = useT();
  const router = useRouter();
  const { reduced, transitions, targets } = useMotion();
  const { view, busy } = p;

  const taskKey = view?.task ? (`lesson.task.${view.task.kind}.${view.task.topic}` as Key) : null;
  const verdict = view?.lastVerdict ? (`lesson.verdict.${view.lastVerdict.split(":")[0]}` as Key) : null;
  const comp = view?.reply?.component;
  const fractions = comp?.params.map((x) => x.value) ?? [];
  const bubble = busy || view === undefined ? t("lesson.thinking") : (view?.reply?.text ?? null);
  const done = view?.state === "TOPIC_DONE";
  const showNext = view?.lastVerdict === "ok" && !done;
  const punch = view?.lastVerdict === "ok" && !busy && !reduced;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="sr-only">{t("lesson.title")}</h1>

      {bubble || done ? (
        <CharacterSays who="ustoz">
          {bubble && <p role={busy || view === undefined ? "status" : undefined} className={busy || view === undefined ? "text-ink-muted" : undefined}>{bubble}</p>}
          {done && <p>{t("lesson.done")}</p>}
        </CharacterSays>
      ) : (
        <Character who="ustoz" size={88} />
      )}

      {verdict && !busy && <p role="status" className="-mt-2 text-body text-ink-muted">{t(verdict)}</p>}
      {p.failed && <p role="alert" className="text-body text-ink">{t("lesson.error")}</p>}

      {view === null && (
        <div>
          <PressButton onClick={p.onStart}>{t("lesson.start")}</PressButton>
        </div>
      )}

      {view?.task && view.canTeach && (
        <>
          <Card className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <Character who="bobr" size={140} />
            <p className="text-title">{t("lesson.teach.lead")}</p>
          </Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <PressButton onClick={() => router.push("/teach")} fullWidth>{t("lesson.teach.cta")}</PressButton>
            <PressButton variant="secondary" onClick={p.onFinish}>{t("plan.toMahalla")}</PressButton>
          </div>
        </>
      )}

      {view?.task && taskKey && !view.canTeach && (
        <>
          <Card className="flex flex-col gap-4">
            {showNext && <p className="text-body text-ink-muted">{t("lesson.next")}</p>}
            <p className="text-body">{fill(t(taskKey), view.task.params) || view.task.numbersShown.join(" ")}</p>
            {taskFractions(view.task.params).length > 0 && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-numeral">
                {taskFractions(view.task.params).map((f, i, all) => (
                  <Fragment key={`${f}-${i}`}>
                    {i > 0 && all.length === 2 && !!view.task?.params.c && <span aria-hidden className="text-ink-muted">+</span>}
                    <Fraction value={f} />
                  </Fragment>
                ))}
              </div>
            )}
            {!busy && view.hintLevel > 0 && (
              <p className="rounded-md bg-clay-100 p-4 text-body text-ink">{t(`lesson.hintStep.${view.task.topic}.${Math.min(4, view.hintLevel)}` as Key) ?? t(`lesson.hintStep.${Math.min(4, view.hintLevel)}` as Key)}</p>
            )}
            {!busy && comp && fractions.length > 0 && (
              <div className="flex flex-wrap items-end justify-center gap-6">
                {comp.type === "line"
                  ? <NumberLine values={fractions} />
                  : fractions.map((value, i) => (comp.type === "pie" ? <Pie key={i} value={value} size={130} /> : <Strip key={i} value={value} />))}
              </div>
            )}
          </Card>

          {done ? (
            <div>
              <PressButton onClick={p.onFinish}>{t("plan.toMahalla")}</PressButton>
            </div>
          ) : (
            <>
              <form className="flex flex-col gap-4 sm:flex-row sm:items-start" onSubmit={(e) => { e.preventDefault(); p.onSubmitAnswer(); }}>
                <motion.div
                  key={view.lastVerdict === "ok" ? `ok-${view.hintLevel}-${view.task.numbersShown.join()}` : "idle"}
                  className="min-w-0 flex-1"
                  initial={punch ? { scale: targets.punchScale } : false}
                  animate={{ scale: 1, transition: transitions.punch }}
                >
                  <input
                    aria-label={t("lesson.answer")}
                    placeholder={t("lesson.answer")}
                    value={p.answer}
                    onChange={(e) => p.onAnswerChange(e.target.value)}
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    className={`${inputBase} h-[72px] px-4 text-center ${p.answer ? "font-display text-numeral font-bold tabular" : "font-sans text-body"}`}
                    style={inkBorder}
                  />
                </motion.div>
                <div className="sm:pt-3">
                  <PressButton type="submit" disabled={busy} fullWidth>{t("lesson.check")}</PressButton>
                </div>
              </form>

              {!busy && view.reply?.hintButton && view.hintLevel < 4 && (
                <div>
                  <PressButton variant="secondary" onClick={p.onHint}>{t("lesson.hint")}</PressButton>
                </div>
              )}

              <form className="flex flex-col gap-3 sm:flex-row sm:items-center" onSubmit={(e) => { e.preventDefault(); p.onSubmitText(); }}>
                <input
                  aria-label={t("lesson.askPlaceholder")}
                  placeholder={t("lesson.askPlaceholder")}
                  value={p.text}
                  onChange={(e) => p.onTextChange(e.target.value)}
                  autoComplete="off"
                  className={`${inputBase} h-[52px] px-4 text-body`}
                  style={{ border: "var(--stroke-ink-thin) solid var(--color-ink-muted)" }}
                />
                <div className="shrink-0 whitespace-nowrap">
                  <PressButton type="submit" variant="secondary" disabled={busy}>{t("lesson.ask")}</PressButton>
                </div>
              </form>
            </>
          )}
        </>
      )}

      {view?.crisis && <CrisisOverlay crisis={view.crisis} onLeave={p.onLeaveCrisis} />}
    </div>
  );
}
