"use client";
// Общие куски движения v3: каскад блоков, живой персонаж, счётчик процентов, очередь появления долей.
// Все числа (мс, пружины, шаги) берутся из lib/motion.ts; здесь только сборка. При «уменьшить движение» всё на месте сразу.
import { animate, motion, useAnimationControls } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { EASE, IDLE_LIFE, POSE_ACT, REVEAL, VIZ, vizDelayMs, useMotion } from "@/lib/motion";

/** Каскад при входе на экран: `{...reveal(i)}` на motion-элемент. Один раз при монтировании, ввод не блокируется. */
export function useReveal() {
  const { reduced, transitions } = useMotion();
  return (i: number) => ({
    initial: reduced ? (false as const) : { opacity: 0, y: REVEAL.y },
    animate: { opacity: 1, y: 0, transition: { ...transitions.appear, delay: reduced ? 0 : Math.min(i * REVEAL.stepS, REVEAL.maxS) } },
  });
}

/**
 * Живая иллюстрация персонажа (Bobr или Ustoz): дышит от пола и чуть покачивается, ритмы у двоих разные, фаза случайная.
 * Вечное движение только здесь, у персонажей. При reduced фигура стоит. Обёртка не меняет раскладку: transform только на ней.
 */
export function Alive({ who, children, className, style, cheer }: { who: "bobr" | "ustoz"; children: ReactNode; className?: string; style?: CSSProperties; cheer?: string | null }) {
  const { reduced } = useMotion();
  const hop = useAnimationControls();
  // верный ответ: одно подпрыгивание (ключи POSE_ACT.happy); новый `cheer` играет снова, пустой — тишина
  useEffect(() => {
    if (!cheer || reduced) return;
    void hop.start({ y: POSE_ACT.happy.act.y, transition: { duration: POSE_ACT.happy.durationS, ease: EASE.out } });
  }, [cheer, reduced, hop]);
  const L = IDLE_LIFE[who];
  const [phase] = useState(() => Math.random());
  const loop = (periodS: number) => ({ duration: periodS, repeat: Infinity, ease: "easeInOut" as const, delay: -phase * periodS });
  return (
    <motion.div
      className={className}
      style={{ transformOrigin: "50% 100%", ...style }}
      animate={reduced
        ? { scaleX: 1, scaleY: 1, rotate: 0, transition: { duration: 0 } }
        : { scaleY: [1, L.breatheY, 1], scaleX: [1, L.breatheX, 1], rotate: [0, L.swayDeg, 0, -L.swayDeg, 0], transition: { scaleY: loop(L.periodS), scaleX: loop(L.periodS), rotate: loop(L.swayPeriodS) } }}
    >
      <motion.div animate={hop}>{children}</motion.div>
    </motion.div>
  );
}

/** Целое число из данных, которое «досчитывается» от 0 к значению без проскока. Тот же текст сразу при reduced. */
export function CountUp({ value, suffix = "", delayMs = 0, className, style }: { value: number; suffix?: string; delayMs?: number; className?: string; style?: CSSProperties }) {
  const { reduced } = useMotion();
  const [shown, setShown] = useState(value);
  const first = useRef(true);
  const cur = useRef(value);
  useLayoutEffect(() => {
    if (reduced) { cur.current = value; setShown(value); return; }
    const from = first.current ? 0 : cur.current;
    first.current = false;
    setShown(Math.round(from)); // до старта показываем исходное, а не конечное: иначе мигнёт итог
    const c = animate(from, value, { duration: VIZ.countMs / 1000, delay: delayMs / 1000, ease: EASE.out, onUpdate: (v) => { cur.current = v; setShown(Math.round(v)); } });
    return () => c.stop();
  }, [value, reduced, delayMs]);
  return <span className={className} style={style}>{shown}{suffix}</span>;
}

const css = (e: readonly number[]) => `cubic-bezier(${e.join(",")})`;
type Part = { name: "in" | "fill" | "ring"; ms: number; delayMs: number };

/** Инлайн-`animation` для элемента визуализации (ключевые кадры `v3-viz-*` — в globals.css; класс `v3-viz` гасит их при reduced). */
export function vizAnim(...parts: Part[]): CSSProperties {
  return { animation: parts.map((p) => `v3-viz-${p.name} ${p.ms}ms ${css(EASE.out)} ${Math.round(p.delayMs)}ms ${p.name === "fill" ? "backwards" : "both"}`).join(", ") };
}

/** Доля i из n в очереди: сперва все по очереди проступают, потом закрашенные «наливаются» в том же порядке. */
export function sliceAnim(i: number, n: number, filled: boolean): CSSProperties {
  const parts: Part[] = [{ name: "in", ms: VIZ.inMs, delayMs: vizDelayMs(i, n) }];
  if (filled) parts.push({ name: "fill", ms: VIZ.fillMs, delayMs: vizDelayMs(n, n) + VIZ.fillAfterMs + (vizDelayMs(i, n) - VIZ.startMs) / 2 });
  return vizAnim(...parts);
}

/** Задержка после очереди из n элементов (мс): точка на прямой стартует, когда деления уже проступили. */
export const afterQueueMs = (n: number) => vizDelayMs(n, n) + VIZ.inMs;
