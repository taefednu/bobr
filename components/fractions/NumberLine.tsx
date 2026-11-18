"use client";
import { motion } from "framer-motion";
import { Fraction } from "@/components/child/Fraction";
import { useMotion } from "@/lib/motion";
import { parseFraction, r2 } from "@/lib/ui/parseFraction";

const W = 320;
const H = 72;
const PAD = 16;
const Y = 28;

/** Прямая 0…max (max — целое ≥ 1): деления по знаменателю первой дроби, бусина lazuli на каждую дробь. */
export function NumberLine({ values, size = W }: { values: string[]; size?: number }) {
  const { transitions } = useMotion();
  const fr = values.flatMap((v) => {
    const f = parseFraction(v);
    return f ? [{ v, ...f }] : [];
  });
  if (!fr.length) return null;
  const max = Math.max(1, ...fr.map(({ k, n }) => Math.ceil(k / n)));
  const den = fr[0].n;
  if (den * max > 120) return null; // деления слиплись бы в чернильную полосу
  const x = (k: number, n: number) => r2(PAD + (k / n / max) * (W - 2 * PAD));
  const ink = { stroke: "var(--color-ink-muted)", strokeWidth: "var(--stroke-ink-thin)", strokeLinecap: "round" } as const;
  return (
    <figure className="flex max-w-full flex-col items-center gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} width={size} height={r2((size * H) / W)} role="img" aria-label={values.join(", ")} className="h-auto max-w-full">
        <line x1={PAD} y1={Y} x2={W - PAD} y2={Y} style={{ stroke: "var(--color-ink)", strokeWidth: "var(--stroke-ink)", strokeLinecap: "round" }} />
        {Array.from({ length: den * max + 1 }, (_, i) => {
          const whole = i % den === 0;
          return <line key={i} x1={x(i, den)} y1={whole ? Y - 12 : Y - 7} x2={x(i, den)} y2={whole ? Y + 12 : Y + 7} style={ink} />;
        })}
        {Array.from({ length: max + 1 }, (_, i) => (
          <text key={i} x={x(i, 1)} y={Y + 32} textAnchor="middle" fontSize="15" style={{ fill: "var(--color-ink)", fontFamily: "var(--font-sans)" }}>{i}</text>
        ))}
        {fr.map(({ v, k, n }) => (
          <motion.circle
            key={v}
            cy={Y}
            r="8"
            initial={{ cx: x(0, 1) }}
            animate={{ cx: x(k, n) }}
            transition={transitions.move}
            style={{ fill: "var(--color-lazuli)", stroke: "var(--color-ink)", strokeWidth: "var(--stroke-ink)" }}
          />
        ))}
      </svg>
      <div className="flex gap-4">
        {fr.map(({ v }) => <Fraction key={v} value={v} className="text-title" />)}
      </div>
    </figure>
  );
}
