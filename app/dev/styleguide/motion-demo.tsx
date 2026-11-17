"use client";
// Демо набора движения: всё из lib/motion.ts. Проверка «пружины на месте» глазами и снимком.
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IDLE, useMotion } from "@/lib/motion";

const SLICES = 6;

export function MotionDemo() {
  const { transitions, targets, reduced } = useMotion();
  const [shown, setShown] = useState(true);
  const [picked, setPicked] = useState<number | null>(1);

  return (
    <section className="grid gap-6" data-testid="motion">
      <h2 className="font-display text-title">Motion {reduced ? "(reduced)" : ""}</h2>

      <div className="flex flex-wrap items-center gap-4">
        <motion.button
          type="button"
          className="h-[52px] rounded-full bg-lazuli px-7 text-label text-paper shadow-[var(--shadow-clay),var(--shadow-rest)] hover:bg-lazuli-deep"
          whileTap={{ scale: targets.pressScale }}
          transition={transitions.press}
          onClick={() => setShown((v) => !v)}
        >
          press · appear
        </motion.button>
        <motion.button
          type="button"
          className="h-[52px] rounded-full bg-paper px-6 text-label text-ink shadow-[var(--shadow-clay),var(--shadow-rest)]"
          whileTap={{ scale: targets.pressScale }}
          transition={transitions.press}
          onClick={() => setPicked((p) => ((p ?? 0) + 1) % SLICES)}
        >
          pop slice
        </motion.button>
      </div>

      <div className="grid items-center gap-8 sm:grid-cols-[1fr_auto_auto]">
        <AnimatePresence>
          {shown && (
            <motion.div
              key="card"
              className="rounded-lg bg-paper p-6 shadow-rest"
              initial={{ opacity: 0, scale: targets.appearFromScale }}
              animate={{ opacity: 1, scale: 1, transition: transitions.appear }}
              exit={{ opacity: 0, scale: targets.appearFromScale, transition: transitions.exit }}
            >
              <p className="text-label text-ink-muted">card · appear from 0.9</p>
              <p className="font-display text-numeral tabular font-bold">3/10</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2.5D-лепёшка: наклон к зрителю, обод из non, кусок выскакивает пружиной pop. */}
        <div className="[perspective:600px]">
          <svg
            width="168"
            height="168"
            viewBox="-60 -60 120 120"
            className="[transform:rotateX(28deg)]"
            aria-label="pie demo"
          >
            <circle r="56" fill="var(--color-non)" />
            {Array.from({ length: SLICES }, (_, i) => {
              const a0 = (i / SLICES) * 2 * Math.PI - Math.PI / 2;
              const a1 = ((i + 1) / SLICES) * 2 * Math.PI - Math.PI / 2;
              const mid = (a0 + a1) / 2;
              const d = `M0 0 L${50 * Math.cos(a0)} ${50 * Math.sin(a0)} A50 50 0 0 1 ${50 * Math.cos(a1)} ${50 * Math.sin(a1)} Z`;
              const out = picked === i ? 8 : 0;
              return (
                <motion.path
                  key={i}
                  d={d}
                  fill={`var(--color-pie-${i + 1})`}
                  stroke="var(--color-paper)"
                  strokeWidth="2"
                  animate={{ x: out * Math.cos(mid), y: out * Math.sin(mid) }}
                  transition={transitions.pop}
                />
              );
            })}
          </svg>
        </div>

        {/* Idle персонажа: дыхание. Заглушка вместо PNG-позы Bobr. */}
        <motion.div
          className="grid size-24 place-items-center rounded-full bg-apricot text-label shadow-[var(--shadow-clay),var(--shadow-rest)]"
          animate={reduced ? undefined : { y: [0, -IDLE.floatPx, 0] }}
          transition={{ duration: IDLE.floatPeriodS, repeat: Infinity, ease: "easeInOut" }}
        >
          idle
        </motion.div>
      </div>
    </section>
  );
}
