"use client";
// Демо набора движения: всё из lib/motion.ts. Проверка «пружины на месте» глазами и снимком.
import { useState } from "react";
import { AnimatePresence, motion, useAnimate } from "framer-motion";
import { PressButton } from "@/components/ui/press-button";
import { IDLE, useMotion } from "@/lib/motion";

const SLICES = 6;
const CRUST_DOTS = 24;
const SLICE_R = 43; // обод 56: корка шириной 13
const DOT_R = 50.5;
const THICK = 7; // толщина лепёшки
const POP_PX = 4; // кусок не пересекает обод
/** Math.cos/sin в Node и в браузере расходятся в последних знаках — округляем, иначе гидрация падает. */
const r = (n: number) => Math.round(n * 100) / 100;
const PUNCH_UP_S = 0.06; // быстрый заход удара; обратно оседает пружиной punch

export function MotionDemo() {
  const { transitions, targets, reduced } = useMotion();
  const [shown, setShown] = useState(true);
  const [picked, setPicked] = useState<number | null>(1);
  const [numeral, animateNumeral] = useAnimate<HTMLParagraphElement>();

  const punch = async () => {
    await animateNumeral(numeral.current, { scale: targets.punchScale }, { duration: reduced ? 0 : PUNCH_UP_S, ease: "easeOut" });
    await animateNumeral(numeral.current, { scale: 1 }, transitions.punch);
  };

  return (
    <section className="grid gap-6" data-testid="motion">
      <h2 className="font-display text-title">Motion {reduced ? "(reduced)" : ""}</h2>

      <div className="flex flex-wrap items-center gap-4">
        <PressButton onClick={() => setShown((v) => !v)}>appear card</PressButton>
        <PressButton variant="secondary" onClick={() => setPicked((p) => ((p ?? 0) + 1) % SLICES)}>pop slice</PressButton>
        <PressButton variant="secondary" onClick={punch}>punch</PressButton>
      </div>

      <div className="grid items-center gap-8 sm:grid-cols-[1fr_auto_auto_auto]">
        <div className="min-h-[120px]">
          <AnimatePresence>
            {shown && (
              <motion.div
                key="card"
                className="rounded-lg bg-paper p-6 shadow-rest"
                style={{ border: "var(--stroke-ink) solid var(--color-ink)" }}
                initial={{ opacity: 0, scale: targets.appearFromScale }}
                animate={{ opacity: 1, scale: 1, transition: transitions.appear }}
                exit={{ opacity: 0, scale: targets.appearFromScale, transition: transitions.exit }}
              >
                <p className="text-label text-ink-muted">card · appear from 0.9</p>
                <p className="font-display text-numeral tabular font-bold">3/10</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p ref={numeral} className="w-fit font-display text-numeral tabular font-bold">1/6</p>

        {/* 2.5D-лепёшка: наклон на самом svg, толщина (нижний диск), широкий обод с кольцом штампа (чекич),
            кусок выскакивает pop, но не доходит до обода. */}
        <svg
          width="168"
          height="184"
          viewBox="-62 -62 124 136"
          className="w-fit [transform:perspective(600px)_rotateX(28deg)]"
          aria-label="pie demo"
        >
          <defs>
            <radialGradient id="pie-hl" gradientUnits="userSpaceOnUse" cx="-16" cy="-18" r="52">
              <stop offset="0" stopColor="var(--color-paper)" stopOpacity="0.55" />
              <stop offset="1" stopColor="var(--color-paper)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cy={THICK} r="56" fill="var(--color-non)" style={{ stroke: "var(--color-ink)", strokeWidth: "var(--stroke-ink)" }} />
          <circle cy={THICK} r="56" fill="var(--color-ink)" opacity="0.3" />
          <circle r="56" fill="var(--color-non)" style={{ stroke: "var(--color-ink)", strokeWidth: "var(--stroke-ink)" }} />
          {Array.from({ length: CRUST_DOTS }, (_, i) => {
            const a = (i / CRUST_DOTS) * 2 * Math.PI;
            return <circle key={i} cx={r(DOT_R * Math.cos(a))} cy={r(DOT_R * Math.sin(a))} r="1.7" fill="var(--color-ink)" opacity="0.7" />;
          })}
          {Array.from({ length: SLICES }, (_, i) => {
            const a0 = (i / SLICES) * 2 * Math.PI - Math.PI / 2;
            const a1 = ((i + 1) / SLICES) * 2 * Math.PI - Math.PI / 2;
            const mid = (a0 + a1) / 2;
            const d = `M0 0 L${r(SLICE_R * Math.cos(a0))} ${r(SLICE_R * Math.sin(a0))} A${SLICE_R} ${SLICE_R} 0 0 1 ${r(SLICE_R * Math.cos(a1))} ${r(SLICE_R * Math.sin(a1))} Z`;
            const out = picked === i ? POP_PX : 0;
            return (
              <motion.g key={i} animate={{ x: out * Math.cos(mid), y: out * Math.sin(mid) }} transition={transitions.pop}>
                <path d={d} fill={`var(--color-pie-${i + 1})`} style={{ stroke: "var(--color-ink)", strokeWidth: "var(--stroke-ink-thin)", strokeLinejoin: "round" }} />
                <path d={d} fill="url(#pie-hl)" />
              </motion.g>
            );
          })}
        </svg>

        {/* Idle персонажа: дыхание. Заглушка вместо PNG-позы Bobr. */}
        <motion.div
          className="grid size-24 place-items-center rounded-full bg-apricot text-center text-label shadow-clay"
          style={{ border: "var(--stroke-ink) solid var(--color-ink)" }}
          animate={reduced ? undefined : { y: [0, -IDLE.floatPx, 0] }}
          transition={{ duration: IDLE.floatPeriodS, repeat: Infinity, ease: "easeInOut" }}
        >
          Bobr idle
        </motion.div>
      </div>
    </section>
  );
}
