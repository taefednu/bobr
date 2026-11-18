"use client";
// Экран урока: чистое отображение. Convex, localStorage и send живут в app/(child)/lesson/page.tsx.
import { motion } from "framer-motion";
import { AiBadge } from "@/components/child/AiBadge";
import { BackLink } from "@/components/child/BackLink";
import { Card } from "@/components/child/Card";
import { Character } from "@/components/child/Character";
import { CharacterSays } from "@/components/child/CharacterSays";
import { Fraction } from "@/components/child/Fraction";
import { NumberLine } from "@/components/fractions/NumberLine";
import { Pie } from "@/components/fractions/Pie";
import { Strip } from "@/components/fractions/Strip";
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
};

/** Дроби из params задачи для показа столбиком рядом с предложением (те же наборы ключей, что в convex/lessonView.ts). */
function taskFractions(p: Record<string, string>): string[] {
  if (p.a && p.b && p.c && p.d) return [`${p.a}/${p.b}`, `${p.c}/${p.d}`];
  if (p.a && p.c && p.den) return [`${p.a}/${p.den}`, `${p.c}/${p.den}`];
  if (p.num && p.den) return [`${p.num}/${p.den}`];
  return [];
}

const inputBase =
  "min-w-0 w-full rounded-lg bg-paper text-ink shadow-[var(--shadow-well)] outline-none placeholder:text-ink-muted focus:[outline:var(--focus-ring)] focus:[outline-offset:var(--focus-offset)]";
const inkBorder = { border: "var(--stroke-ink) solid var(--color-ink)" } as const;

export function LessonView(p: LessonViewProps) {
  const { t } = useT();
  const { reduced, transitions, targets } = useMotion();
  const { view, busy } = p;

  const taskKey = view?.task ? (`lesson.task.${view.task.kind}.${view.task.topic}` as Key) : null;
  const verdict = view?.lastVerdict ? (`lesson.verdict.${view.lastVerdict.split(":")[0]}` as Key) : null;
  const comp = view?.reply?.component;
  const fractions = comp?.params.map((x) => x.value) ?? [];
  const bubble = busy ? t("lesson.thinking") : (view?.reply?.text ?? null);
  const punch = view?.lastVerdict === "ok" && !busy && !reduced;

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/mahalla" />
      <h1 className="sr-only">{t("lesson.title")}</h1>

      {bubble ? (
        <CharacterSays who="ustoz">
          <p role={busy ? "status" : undefined} className={busy ? "text-ink-muted" : undefined}>{bubble}</p>
        </CharacterSays>
      ) : (
        <Character who="ustoz" size={88} />
      )}

      {!view && (
        <div>
          <PressButton onClick={p.onStart}>{t("lesson.start")}</PressButton>
        </div>
      )}

      {view?.task && taskKey && (
        <>
          <Card className="flex flex-col gap-4">
            <p className="text-body">{fill(t(taskKey), view.task.params) || view.task.numbersShown.join(" ")}</p>
            {taskFractions(view.task.params).length > 0 && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-numeral">
                {taskFractions(view.task.params).map((f, i) => <Fraction key={`${f}-${i}`} value={f} />)}
              </div>
            )}
          </Card>

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
                className={`${inputBase} h-[72px] px-4 text-center font-display text-numeral font-bold tabular`}
                style={inkBorder}
              />
            </motion.div>
            <div className="sm:pt-3">
              <PressButton type="submit" disabled={busy} fullWidth>{t("lesson.check")}</PressButton>
            </div>
          </form>

          {verdict && !busy && (
            <p role="status" className="text-body text-ink">
              {t(verdict)}{view.lastVerdict === "ok" && view.state !== "TOPIC_DONE" ? ` ${t("lesson.next")}` : ""}
            </p>
          )}
          {view.state === "TOPIC_DONE" && <p role="status" className="text-body text-ink">{t("lesson.done")}</p>}
          {p.failed && <p role="alert" className="text-body text-ink">{t("lesson.error")}</p>}

          {!busy && view.hintLevel > 0 && (
            <p className="rounded-lg bg-clay-100 p-4 text-body text-ink">{t(`lesson.hintStep.${Math.min(4, view.hintLevel)}` as Key)}</p>
          )}

          {!busy && comp && fractions.length > 0 && (
            <Card className="flex flex-wrap items-end justify-center gap-6">
              {comp.type === "line"
                ? <NumberLine values={fractions} />
                : fractions.map((value, i) => (comp.type === "pie" ? <Pie key={i} value={value} /> : <Strip key={i} value={value} />))}
            </Card>
          )}

          {!busy && view.reply?.hintButton && view.hintLevel < 4 && view.state !== "TOPIC_DONE" && (
            <div>
              <PressButton variant="secondary" onClick={p.onHint}>{t("lesson.hint")}</PressButton>
            </div>
          )}

          <form className="flex flex-col gap-3 sm:flex-row sm:items-start" onSubmit={(e) => { e.preventDefault(); p.onSubmitText(); }}>
            <input
              aria-label={t("lesson.askPlaceholder")}
              placeholder={t("lesson.askPlaceholder")}
              value={p.text}
              onChange={(e) => p.onTextChange(e.target.value)}
              autoComplete="off"
              className={`${inputBase} h-[52px] px-4 text-body`}
              style={{ border: "var(--stroke-ink-thin) solid var(--color-ink-muted)" }}
            />
            <PressButton type="submit" variant="secondary" disabled={busy}>{t("lesson.ask")}</PressButton>
          </form>
        </>
      )}

      {view?.crisis && (
        // Спокойно и без движения: полный экран поверх всего, текст и номера только из view.crisis.
        <div role="alertdialog" aria-modal="true" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-sand p-6 text-center text-ink">
          <AiBadge />
          <p className="max-w-md text-title">{view.crisis.text}</p>
          <p className="text-title font-bold">{t("lesson.crisis.call")} {view.crisis.numbers.join(", ")}</p>
          <PressButton onClick={p.onLeaveCrisis}>{t("lesson.crisis.back")}</PressButton>
        </div>
      )}
    </div>
  );
}
