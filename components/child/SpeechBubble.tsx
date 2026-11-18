"use client";
// Реплика персонажа: paper, ink-контур, хвост к персонажу слева. aria-live на постоянной внешней обёртке:
// читалка озвучит новую реплику целиком один раз. Внутри — вид, который появляется (E7) и «хлопает» при новой реплике (A10).
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { BUBBLE_DELAY_S, THINKING, TYPING, useMotion } from "@/lib/motion";

export { typingSeconds } from "@/lib/motion";

const words = (text: string) => text.split(/(\s+)/);

/** Реплика по словам. Все слова сразу в DOM (высота не прыгает, aria-live читает целиком), раскрываются opacity.
 *  Новый `text` = новый вход: ставь `key={text}` снаружи. Reduced: текст сразу. */
export function TypedText({ text }: { text: string }) {
  const { reduced } = useMotion();
  if (reduced) return <>{text}</>;
  const n = text.split(/\s+/).filter(Boolean).length;
  const step = Math.min(TYPING.wordMs, (TYPING.maxS * 1000) / n) / 1000;
  let i = 0;
  return (
    <>
      {words(text).map((w, k) =>
        /^\s*$/.test(w) ? (
          w
        ) : (
          <motion.span
            key={k}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: TYPING.wordFadeS, delay: BUBBLE_DELAY_S + i++ * step, ease: "linear" }}
          >
            {w}
          </motion.span>
        ),
      )}
    </>
  );
}

/** Три точки ожидания: opacity по очереди (THINKING). Reduced: стоят. */
function Dots({ reduced }: { reduced: boolean }) {
  return (
    <span aria-hidden className="absolute inset-x-4 top-4 flex h-[1lh] items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block size-2.5 rounded-full bg-ink"
          animate={reduced ? undefined : { opacity: [0.25, 1, 0.25] }}
          transition={{ duration: THINKING.dotPeriodS, repeat: Infinity, delay: i * THINKING.dotStepS, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

type Props = {
  who?: "bobr" | "ustoz";
  /** Смена значения — облачко хлопает заново (A10). Без него хлопает только при первом показе. */
  popKey?: string;
  /** Точки ожидания поверх. Содержимое остаётся в DOM невидимым и держит высоту. */
  dots?: boolean;
  /** Текст для читалки на время ожидания («X думает…»): вне невидимой части, role=status. */
  status?: string;
  children?: ReactNode;
};

export function SpeechBubble({ popKey, dots = false, status, children }: Props) {
  const { reduced, transitions, targets } = useMotion();
  return (
    <div aria-live="polite" className="relative min-w-0 flex-1">
      <motion.div
        key={popKey}
        className="relative origin-left rounded-lg bg-paper p-4 text-body text-ink shadow-rest"
        style={{ border: "var(--stroke-ink) solid var(--color-ink)" }}
        initial={reduced ? false : { opacity: 0, scale: targets.appearFromScale }}
        animate={{ opacity: 1, scale: 1, transition: { ...transitions.appear, delay: reduced ? 0 : BUBBLE_DELAY_S } }}
      >
        {/* Хвост (D4 шаг 1): заливка закрывает ink-контур пузыря, линия только по диагоналям, скругления на концах. */}
        <svg aria-hidden width="16" height="22" viewBox="0 0 16 22" className="absolute -left-4 top-5" style={{ overflow: "visible" }}>
          <path d="M16 1.2 L12.5 1.2 L0 11 L12.5 20.8 L16 20.8 Z" fill="var(--color-paper)" />
          <path
            d="M12.5 1.2 L0 11 L12.5 20.8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ stroke: "var(--color-ink)", strokeWidth: "var(--stroke-ink)" }}
          />
        </svg>
        <div className={dots ? "invisible" : undefined}>{children ?? <p aria-hidden>&nbsp;</p>}</div>
        {status && <span role="status" className="sr-only">{status}</span>}
        {dots && <Dots reduced={reduced} />}
      </motion.div>
    </div>
  );
}
