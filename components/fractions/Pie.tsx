"use client";
// Лепёшка (DESIGN.md §5): 2.5D, ink-обод, штамп чекич, k долей pie-1…6, остальные clay-100.
import { useId } from "react";
import { Fraction } from "@/components/child/Fraction";
import { parseFraction, r2 } from "@/lib/ui/parseFraction";

const SLICE_R = 43;
const DOT_R = 50.5;
const THICK = 7;
const CRUST_DOTS = 24;
const INK = { stroke: "var(--color-ink)", strokeWidth: "var(--stroke-ink)" } as const;

export function Pie({ value, size = 168 }: { value: string; size?: number }) {
  const gid = `pie-hl-${useId().replace(/:/g, "")}`;
  const f = parseFraction(value);
  if (!f || f.k > f.n) return null;
  const { k, n } = f;
  const pt = (i: number) => {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2;
    return `${r2(SLICE_R * Math.cos(a))} ${r2(SLICE_R * Math.sin(a))}`;
  };
  return (
    <figure className="flex max-w-full flex-col items-center gap-2">
      <svg
        viewBox="-62 -62 124 136"
        width={size}
        height={r2((size * 136) / 124)}
        role="img"
        aria-label={value}
        className="h-auto max-w-full [transform:perspective(600px)_rotateX(28deg)]"
      >
        <defs>
          <radialGradient id={gid} gradientUnits="userSpaceOnUse" cx="-16" cy="-18" r="52">
            <stop offset="0" stopColor="var(--color-paper)" stopOpacity="0.55" />
            <stop offset="1" stopColor="var(--color-paper)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cy={THICK} r="56" fill="var(--color-non)" {...INK} />
        <circle cy={THICK} r="56" fill="var(--color-ink)" opacity="0.3" />
        <circle r="56" fill="var(--color-non)" {...INK} />
        {Array.from({ length: CRUST_DOTS }, (_, i) => {
          const a = (i / CRUST_DOTS) * 2 * Math.PI;
          return <circle key={i} cx={r2(DOT_R * Math.cos(a))} cy={r2(DOT_R * Math.sin(a))} r="1.7" fill="var(--color-ink)" opacity="0.7" />;
        })}
        {n === 1 ? (
          <circle r={SLICE_R} fill={k ? "var(--color-pie-1)" : "var(--color-clay-100)"} style={{ stroke: "var(--color-ink)", strokeWidth: "var(--stroke-ink-thin)" }} />
        ) : (
          Array.from({ length: n }, (_, i) => {
            const d = `M0 0 L${pt(i)} A${SLICE_R} ${SLICE_R} 0 0 1 ${pt(i + 1)} Z`;
            return (
              <g key={i}>
                <path d={d} fill={i < k ? `var(--color-pie-${(i % 6) + 1})` : "var(--color-clay-100)"} style={{ stroke: "var(--color-ink)", strokeWidth: "var(--stroke-ink-thin)", strokeLinejoin: "round" }} />
                {i < k && <path d={d} fill={`url(#${gid})`} />}
              </g>
            );
          })
        )}
      </svg>
      <Fraction value={value} className="text-title" />
    </figure>
  );
}
