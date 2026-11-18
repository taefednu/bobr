"use client";
// Собеседник крупно. Idle (дыхание, моргание) живёт в Character; ожидание ответа качает головой (THINKING),
// поза из ответа сервера играет действие на каждую новую реплику (POSE_ACT).
import { useEffect, useRef } from "react";
import { motion, useAnimate } from "framer-motion";
import { Character } from "@/components/child/Character";
import { POSE_ACT, THINKING, useMotion } from "@/lib/motion";
import type { Partner } from "./model";

type Props = { who: Partner; pose: string | null; turn: number; thinking: boolean };

export function Stage({ who, pose, turn, thinking }: Props) {
  const { reduced, transitions } = useMotion();
  const p = POSE_ACT[pose ?? "idle"] ?? POSE_ACT.idle;
  const [actor, play] = useAnimate<HTMLDivElement>();
  const last = useRef(turn);

  useEffect(() => {
    if (turn === last.current) return;
    last.current = turn;
    if (reduced || thinking || !actor.current || Object.keys(p.act).length === 0) return;
    void play(actor.current, p.act, { duration: p.durationS, ease: "easeInOut" });
  }, [turn, reduced, thinking, p, actor, play]);

  return (
    // key по собеседнику: при смене новый персонаж въезжает, а не подменяется
    <motion.div
      key={who}
      initial={reduced ? false : { x: -36, opacity: 0 }}
      animate={{ x: 0, opacity: 1, transition: transitions.pop }}
      style={{ transformOrigin: "50% 100%" }}
    >
      <motion.div
        style={{ transformOrigin: "50% 100%" }}
        animate={
          thinking && !reduced
            ? { rotate: [...THINKING.rotate], scale: 1 }
            : { rotate: thinking ? POSE_ACT.think.rest.rotate : p.rest.rotate, scale: p.rest.scale }
        }
        transition={thinking && !reduced ? { duration: THINKING.periodS, repeat: Infinity, ease: "easeInOut" } : transitions.pop}
      >
        <div ref={actor} style={{ transformOrigin: "50% 100%" }}>
          <Character
            who={who}
            size={96}
            className="md:!size-[260px]"
            beat={String(turn)}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
