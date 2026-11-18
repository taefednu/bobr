"use client";
// Живой персонаж: PNG-поза дышит и моргает, на новую реплику приседает и подпрыгивает (скилл bobr-animation).
// Движение включает вся фигура; при «уменьшить движение» поза просто стоит.
import { useEffect, useRef, useState } from "react";
import { motion, useAnimate } from "framer-motion";
import { useT } from "@/lib/i18n";
import { LID_COLOR, POSES, REACTION, type Pose, type Who } from "@/lib/ui/characters";
import { IDLE, useMotion } from "@/lib/motion";

export type { Pose, Who };

type Props = {
  who: Who;
  pose?: Pose;
  size?: number;
  className?: string;
  /** Меняется значение — персонаж реагирует. Обычно это текст его реплики. */
  beat?: string;
};

function useBlink(enabled: boolean) {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout>;
    const [min, max] = IDLE.blinkEveryS;
    const schedule = () => {
      timer = setTimeout(() => {
        setClosed(true);
        timer = setTimeout(() => {
          setClosed(false);
          schedule();
        }, IDLE.blinkMs);
      }, (min + Math.random() * (max - min)) * 1000);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [enabled]);
  return closed;
}

/** Коробка фиксированного размера: вёрстка не прыгает, поза вписана в неё и стоит на нижнем крае. */
export function Character({ who, pose = "idle", size = 96, className = "", beat }: Props) {
  const { t } = useT();
  const { reduced } = useMotion();
  const closed = useBlink(!reduced);
  const [body, animateBody] = useAnimate<HTMLSpanElement>();
  const lastBeat = useRef(beat);
  const { w, h, lids } = POSES[who][pose];
  const base = `/${who}/${pose}`;

  useEffect(() => {
    if (beat === lastBeat.current) return;
    lastBeat.current = beat;
    if (reduced || !body.current) return;
    void animateBody(
      body.current,
      { scaleY: [...REACTION.scaleY], scaleX: [...REACTION.scaleX] },
      { duration: REACTION.durationS, ease: "easeInOut" },
    );
  }, [beat, reduced, animateBody, body]);

  return (
    <span className={`flex shrink-0 items-end justify-center ${className}`} style={{ width: size, height: size }}>
      <motion.span
        className="block"
        style={{ aspectRatio: `${w} / ${h}`, [w < h ? "height" : "width"]: "100%" }}
        animate={reduced ? undefined : { y: [0, -IDLE.floatPx, 0] }}
        transition={{ duration: IDLE.floatPeriodS, repeat: Infinity, ease: "easeInOut" }}
      >
        <span ref={body} className="relative block size-full origin-bottom">
          <picture>
            <source srcSet={`${base}.webp`} type="image/webp" />
            {/* eslint-disable-next-line @next/next/no-img-element -- прозрачная поза, размер задаёт коробка */}
            <img src={`${base}.png`} alt={t(`char.${who}`)} width={w} height={h} draggable={false} className="block size-full" />
          </picture>
          <svg viewBox={`0 0 ${w} ${h}`} aria-hidden className="pointer-events-none absolute inset-0 size-full">
            {lids.map(([cx, cy, rx, ry, rotate]) => (
              <motion.g
                key={cx}
                transform={`rotate(${rotate} ${cx} ${cy})`}
                initial={false}
                animate={{ opacity: closed ? 1 : 0 }}
                transition={{ duration: IDLE.blinkMs / 2000 }}
              >
                <motion.ellipse
                  cx={cx}
                  cy={cy}
                  rx={rx}
                  ry={ry}
                  fill={LID_COLOR[who]}
                  style={{ originX: "50%", originY: "0%", transformBox: "fill-box" }}
                  initial={false}
                  animate={{ scaleY: closed ? 1 : 0.08 }}
                  transition={{ duration: IDLE.blinkMs / 2000 }}
                />
                {/* линия сомкнутых ресниц */}
                <path
                  d={`M${cx - rx} ${cy + ry * 0.2} Q${cx} ${cy + ry * 1.1} ${cx + rx} ${cy + ry * 0.2}`}
                  fill="none"
                  stroke="var(--color-ink)"
                  strokeWidth={5}
                  strokeLinecap="round"
                />
              </motion.g>
            ))}
          </svg>
        </span>
      </motion.span>
    </span>
  );
}
