"use client";
// Живой персонаж на одном PNG `idle` (скилл bobr-animation): дыхание от пола, покачивание, моргание, пятно под лапами;
// думает, говорит, реагирует (emotion + beat) движением всей фигуры, без новых поз-файлов.
// Слои transform вложены друг в друга, чтобы значения не спорили; при «уменьшить движение» всё стоит.
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useAnimate } from "framer-motion";
import { useT } from "@/lib/i18n";
import { LID_COLOR, POSES, REACTION, type Pose, type Who } from "@/lib/ui/characters";
import { IDLE, IDLE_LIFE, POSE_ACT, TALK, THINKING, STILL, useMotion } from "@/lib/motion";

export type { Pose, Who };

/** Эмоция = ключ POSE_ACT: стойка (`rest`) держится, действие (`act`) играет на каждую смену `beat`. */
export type Emotion = "wave" | "happy" | "aha" | "proud" | "think" | "confused" | "sad";

type Props = {
  who: Who;
  pose?: Pose;
  size?: number;
  className?: string;
  /** Меняется значение — персонаж реагирует (первое значение не играет). Обычно это текст реплики. */
  beat?: string;
  /** Стойка и действие по `beat`. Без неё на `beat` играет общий присед-подскок (REACTION). */
  emotion?: Emotion;
  /** Ждёт ответ: качает головой по THINKING, пока true. */
  thinking?: boolean;
  /** Говорит: тело пульсирует по TALK, пока true (пока печатается реплика). */
  talking?: boolean;
  /** Приходит на экран (вход снизу) и раз в IDLE_LIFE.gestureEveryS сам играет жест `think`. */
  lively?: boolean;
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

const FEET = { transformOrigin: "50% 100%" } as const;

/** Коробка фиксированного размера: вёрстка не прыгает, поза вписана в неё и стоит на нижнем крае. */
export function Character({ who, pose = "idle", size = 96, className = "", beat, emotion, thinking = false, talking = false, lively = false }: Props) {
  const { t } = useT();
  const { reduced, transitions, targets } = useMotion();
  const closed = useBlink(!reduced);
  const [body, animateBody] = useAnimate<HTMLSpanElement>();
  const lastBeat = useRef(beat);
  const acting = useRef(false);
  const busy = useRef(false); // думает или говорит: жест не играем
  const [phase] = useState(() => Math.random()); // фаза idle: два персонажа не идут в такт
  const { w, h, lids } = POSES[who][pose];
  const base = `/${who}/${pose}`;
  const life = IDLE_LIFE[who];
  const rest = emotion ? POSE_ACT[emotion].rest : POSE_ACT.idle.rest;

  useEffect(() => {
    busy.current = thinking || talking;
  }, [thinking, talking]);

  const play = useCallback(
    async (name: string) => {
      const act = POSE_ACT[name]?.act;
      if (!body.current || !act || Object.keys(act).length === 0) return;
      acting.current = true;
      try {
        await animateBody(
          body.current,
          Object.fromEntries(Object.entries(act).map(([k, v]) => [k, [...v]])),
          { duration: POSE_ACT[name].durationS, ease: "easeInOut" },
        );
      } finally {
        acting.current = false;
      }
    },
    [animateBody, body],
  );

  useEffect(() => {
    if (beat === lastBeat.current) return;
    lastBeat.current = beat;
    if (reduced || !body.current) return;
    if (emotion) void play(emotion);
    else void animateBody(body.current, { scaleY: [...REACTION.scaleY], scaleX: [...REACTION.scaleX] }, { duration: REACTION.durationS, ease: "easeInOut" });
  }, [beat, emotion, reduced, animateBody, body, play]);

  // Живой персонаж сам иногда играет жест, если ничего другого не делает.
  useEffect(() => {
    if (!lively || reduced) return;
    const [a, b] = IDLE_LIFE.gestureEveryS;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      timer = setTimeout(() => {
        if (!busy.current && !acting.current) void play("think");
        next();
      }, (a + Math.random() * (b - a)) * 1000);
    };
    next();
    return () => clearTimeout(timer);
  }, [lively, reduced, play]);

  const loop = (periodS: number) => ({ duration: periodS, repeat: Infinity, ease: "easeInOut" as const, delay: -phase * periodS });

  return (
    <motion.span
      className={`relative flex shrink-0 items-end justify-center ${className}`}
      style={{ width: size, height: size }}
      initial={lively && !reduced ? { opacity: 0, y: 10, scale: targets.appearFromScale } : false}
      animate={{ opacity: 1, y: 0, scale: 1, transition: transitions.pop }}
    >
      {/* Пятно под лапами: сдвинуто вправо от света (источник сверху-слева), сжимается на вдохе. Стоит на земле, не качается. */}
      <span aria-hidden className="pointer-events-none absolute -bottom-[3%] left-[54%] h-[8%] w-[60%] -translate-x-1/2">
        <motion.span
          className="block size-full rounded-full bg-ink/20"
          animate={reduced ? { scaleX: 1 } : { scaleX: [1, 0.92, 1] }}
          transition={reduced ? STILL : loop(life.periodS)}
        />
      </span>
      {/* L1: подъём и покачивание от лап. */}
      <motion.span
        className="block"
        style={{ aspectRatio: `${w} / ${h}`, [w < h ? "height" : "width"]: "100%", ...FEET }}
        animate={reduced ? { y: 0, rotate: 0 } : { y: [0, -life.liftPx, 0], rotate: [-life.swayDeg, life.swayDeg, -life.swayDeg] }}
        transition={reduced ? STILL : { y: loop(life.periodS), rotate: loop(life.swayPeriodS) }}
      >
        {/* L2: дыхание. */}
        <motion.span
          className="block size-full"
          style={FEET}
          animate={reduced ? { scaleY: 1, scaleX: 1 } : { scaleY: [1, life.breatheY, 1], scaleX: [1, life.breatheX, 1] }}
          transition={reduced ? STILL : loop(life.periodS)}
        >
          {/* L3: стойка эмоции или качание головой, пока ждём ответ. */}
          <motion.span
            className="block size-full"
            style={FEET}
            animate={
              thinking && !reduced
                ? { rotate: [...THINKING.rotate], scale: 1 }
                : { rotate: thinking ? POSE_ACT.think.rest.rotate : rest.rotate, scale: rest.scale }
            }
            transition={thinking && !reduced ? { duration: THINKING.periodS, repeat: Infinity, ease: "easeInOut" } : transitions.pop}
          >
            {/* L4: говорит. */}
            <motion.span
              className="block size-full"
              style={FEET}
              animate={talking && !reduced ? { scaleY: [...TALK.scaleY], scaleX: [...TALK.scaleX] } : { scaleY: 1, scaleX: 1 }}
              transition={talking && !reduced ? { duration: TALK.periodS, repeat: Infinity, ease: "easeInOut" } : transitions.appear}
            >
              {/* L5: разовое действие (реакция, жест). */}
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
          </motion.span>
        </motion.span>
      </motion.span>
    </motion.span>
  );
}
