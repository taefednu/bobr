"use client";
// Bobr крупно, в позе из ответа сервера. Позы пока на одном PNG: стойку и действие даёт движение (POSE_ACT).
// Ожидание ответа — тоже он: качает головой, в облачке зажигаются три точки (THINKING). Reduced motion: всё стоит.
import { useEffect, useRef } from "react";
import { motion, useAnimate } from "framer-motion";
import { Character } from "@/components/child/Character";
import { useT } from "@/lib/i18n";
import { POSE_ACT, THINKING, useMotion } from "@/lib/motion";

type Props = {
  pose: string | null;
  /** Меняется на каждую новую реплику: действие позы играет заново. */
  turn: number;
  thinking: boolean;
  celebrate?: boolean;
};

export function BobrHero({ pose, turn, thinking, celebrate }: Props) {
  const { t } = useT();
  const { reduced, transitions } = useMotion();
  const p = POSE_ACT[pose ?? "idle"] ?? POSE_ACT.idle;
  const [actor, play] = useAnimate<HTMLDivElement>();
  const lastTurn = useRef(turn);

  // Действие позы играет один раз на новую реплику; Character внутри не перемонтируется (моргание и дыхание живут).
  useEffect(() => {
    if (turn === lastTurn.current) return;
    lastTurn.current = turn;
    if (reduced || thinking || !actor.current || Object.keys(p.act).length === 0) return;
    void play(actor.current, p.act, { duration: p.durationS, ease: "easeInOut" });
  }, [turn, reduced, thinking, p, actor, play]);

  return (
    <div className="relative flex items-end justify-center">
      <motion.div
        // въезд при первом показе: Bobr «пришёл с ошибкой»
        initial={reduced ? false : { x: -48, opacity: 0 }}
        animate={{ x: 0, opacity: 1, transition: transitions.pop }}
      >
        <motion.div
          style={{ transformOrigin: "50% 100%" }}
          animate={thinking && !reduced ? { rotate: [...THINKING.rotate], scale: 1 } : { rotate: thinking ? POSE_ACT.think.rest.rotate : p.rest.rotate, scale: p.rest.scale }}
          transition={thinking && !reduced ? { duration: THINKING.periodS, repeat: Infinity, ease: "easeInOut" } : transitions.pop}
        >
          <div ref={actor} style={{ transformOrigin: "50% 100%" }}>
            <Character who="bobr" size={150} className="md:!size-[340px]" beat={String(turn)} />
          </div>
        </motion.div>
      </motion.div>

      {thinking && (
        <div
          role="status"
          className="absolute right-0 top-2 flex items-center gap-1.5 rounded-full bg-paper px-4 py-3 shadow-rest md:right-6"
          style={{ border: "var(--stroke-ink) solid var(--color-ink)" }}
        >
          <span className="sr-only">{t("teach.thinking")}</span>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              aria-hidden
              className="block size-2.5 rounded-full bg-ink"
              animate={reduced ? undefined : { opacity: [0.25, 1, 0.25] }}
              transition={{ duration: THINKING.dotPeriodS, repeat: Infinity, delay: i * THINKING.dotStepS, ease: "easeInOut" }}
            />
          ))}
        </div>
      )}

      {celebrate && !reduced && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-x-8 bottom-0 -z-10 h-3/4 rounded-full"
          style={{ background: "radial-gradient(in oklch, var(--color-lamp), transparent 70%)" }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 0.85, scale: 1, transition: transitions.pop }}
        />
      )}
    </div>
  );
}
