"use client";
// Экран цели в языке v3: колонка V3Screen, кнопка назад на /start, Bobr с репликой, три варианта цели или «Дальше».
// Варианты и intent задаёт код (GOAL_INTENTS), реплика Bobr (`line`, goalDialog) только слова: без неё экран целиком работает на i18n.
import { AnimatePresence, motion } from "framer-motion";
import { IconArrowLeft, IconChevron, V3Card, V3RoundButton, V3Screen } from "@/components/v3";
import { Avatar } from "@/components/v3/chat/Bubbles";
import { useT } from "@/lib/i18n";
import { useMotion } from "@/lib/motion";
import { GOAL_INTENTS, type GoalIntent } from "@/lib/ui/types";

type Props = {
  /** null: ещё не выбрал, Bobr спрашивает, видны три кнопки. */
  intent: GoalIntent | null;
  onPick: (intent: GoalIntent) => void;
  onContinue: () => void;
  /** Живая фраза Bobr (goalDialog). null: модель не ответила или ещё думает, тогда goal.ask из i18n. */
  line?: string | null;
  /** Сохранение не прошло: показываем спокойную заметку, кнопка остаётся. */
  failed?: boolean;
};

const BUBBLE = { borderRadius: "var(--v3-r-bubble)", background: "var(--v3-card-ustoz)", boxShadow: "var(--v3-shadow-card)" } as const;

export function GoalView({ intent, onPick, onContinue, line, failed }: Props) {
  const { t } = useT();
  const { reduced, transitions } = useMotion();
  const said = intent ? t(`goal.reply.${intent}`) : line ?? t("goal.ask");
  return (
    <V3Screen className="gap-6 pb-8">
      <header className="pt-[37px]">
        <V3RoundButton label={t("child.back")} size={42} tone="cream" href="/start"><IconArrowLeft size={20} /></V3RoundButton>
      </header>
      <h1 className="v3-type-screen">{t("goal.title")}</h1>

      <div className="flex items-start gap-[9px]" role="group" aria-live="polite">
        <div className="mt-1"><Avatar who="bobr" size={64} /></div>
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={said}
              className="v3-type-chat px-5 py-3"
              style={BUBBLE}
              initial={reduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, transition: transitions.appear }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
            >
              {said}
            </motion.p>
          </AnimatePresence>
          <p role="note" className="v3-type-caption mt-2 px-2" style={{ color: "var(--v3-ink-soft)" }}>{t("ai.badge")}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        {intent ? (
          <button
            type="button"
            onClick={onContinue}
            className="v3-type-label flex h-14 w-full cursor-pointer items-center justify-center rounded-full transition-transform duration-100 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
            style={{ background: "linear-gradient(160deg, var(--v3-teal), var(--v3-teal-strong))", color: "var(--v3-on-teal)", boxShadow: "var(--v3-shadow-round)" }}
          >
            {t("goal.continue")}
          </button>
        ) : (
          GOAL_INTENTS.map((i) => (
            <V3Card
              key={i}
              as="button"
              type="button"
              radius="stat"
              onClick={() => onPick(i)}
              className="v3-type-label flex min-h-16 w-full cursor-pointer items-center justify-between gap-3 px-5 py-3 text-left transition-transform duration-100 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              <span className="min-w-0">{t(`goal.btn.${i}`)}</span>
              <span aria-hidden style={{ color: "var(--v3-ink-soft)" }}><IconChevron /></span>
            </V3Card>
          ))
        )}
        {failed && (
          <V3Card role="alert" tone="note" radius="stat" className="v3-type-caption px-5 py-3">{t("lesson.error")}</V3Card>
        )}
      </div>
    </V3Screen>
  );
}
