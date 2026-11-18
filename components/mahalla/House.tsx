"use client";
// Дом-тема в 2.5D (DESIGN.md §2, §5): светлая передняя стена, тёмная боковая, плоская крыша с парапетом,
// торцы балок (вассо) выступают из-под края крыши, бирюзовые дверь и рамы, контур ink. Только токены.
import { useId } from "react";
import type { HouseState } from "@/lib/types";

const WALL: Record<Exclude<HouseState, "empty">, string> = {
  scaffold: "var(--color-terracotta)",
  built: "var(--color-non)",
  alive: "var(--color-non)",
  dimmed: "var(--color-dusk)",
};
const INK = { stroke: "var(--color-ink)", strokeWidth: "var(--stroke-ink)", strokeLinejoin: "round" } as const;
const THIN = { stroke: "var(--color-ink)", strokeWidth: "var(--stroke-ink-thin)", strokeLinejoin: "round" } as const;
const BEAM_X = [18, 32, 46, 60];
const SCAFFOLD = ["M10 94 V30", "M80 94 V30", "M10 40 H80", "M10 70 H80", "M10 40 L80 70", "M10 70 L80 40"];

export function House({ state, size = 150 }: { state: HouseState; size?: number }) {
  const h = (size * 104) / 130;
  const id = `halo-${useId().replace(/:/g, "")}`;
  if (state === "empty") {
    return (
      <svg width={size} height={h} viewBox="0 0 130 104" aria-hidden>
        <path
          d="M12 92 L80 92 L104 80 L36 80 Z"
          fill="none"
          style={{ stroke: "var(--color-ink-muted)", strokeWidth: "var(--stroke-ink-thin)", strokeDasharray: "5 5" }}
        />
      </svg>
    );
  }
  const wall = WALL[state];
  const lit = state === "alive";
  const dim = state === "dimmed";
  const build = state === "scaffold";
  const top = build ? 68 : 44; // scaffold: стены только по пояс
  const frame = dim ? "var(--color-dusk)" : "var(--color-tile)";
  return (
    <svg width={size} height={h} viewBox="0 0 130 104" aria-hidden>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor="var(--color-lamp)" stopOpacity="0.65" />
          <stop offset="1" stopColor="var(--color-lamp)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* тень на земле: вправо-вниз от света */}
      <ellipse cx="68" cy="95" rx="56" ry="6" fill="var(--color-ink)" opacity="0.2" />
      {/* боковая стена (тень) */}
      <path d={`M80 ${top} L104 ${top - 8} V82 L80 92 Z`} fill={wall} {...INK} />
      <path d={`M80 ${top} L104 ${top - 8} V82 L80 92 Z`} fill="var(--color-ink)" opacity="0.22" />
      {/* передняя стена (свет сверху-слева) */}
      <rect x="12" y={top} width="68" height={92 - top} fill={wall} {...INK} />
      <path d={`M13.5 ${top + 1.5} H50 L13.5 ${top + 32} Z`} fill="var(--color-paper)" opacity="0.22" />
      {!build && (
        <>
          {/* вассо: торцы балок выступают из-под края крыши, с тенью на стене */}
          {BEAM_X.map((x) => (
            <g key={x}>
              <rect x={x + 3} y="48" width="8" height="7" fill="var(--color-ink)" opacity="0.25" />
              <path d={`M${x + 6} 46 L${x + 9} 43.5 V49.5 L${x + 6} 52 Z`} fill="var(--color-ink)" {...THIN} />
              <rect x={x} y="46" width="6" height="6" fill="var(--color-apricot)" {...THIN} />
            </g>
          ))}
          {/* крыша: верхняя грань, парапет */}
          <path d="M8 38 L80 38 L104 30 L32 30 Z" fill={wall} {...INK} />
          <path d="M8 38 L80 38 L104 30 L32 30 Z" fill="var(--color-paper)" opacity="0.3" />
          <rect x="8" y="38" width="72" height="6" fill={wall} {...INK} />
          <path d="M80 38 L104 30 V36 L80 44 Z" fill={wall} {...INK} />
          <path d="M80 38 L104 30 V36 L80 44 Z" fill="var(--color-ink)" opacity="0.22" />
          {/* дверь */}
          <rect x="24" y="62" width="16" height="30" rx="2" fill={frame} {...INK} />
          <circle cx="36" cy="78" r="1.6" fill="var(--color-ink)" />
          {/* окна: у живого дома лампа и гало (единственное свечение) */}
          {lit && <circle cx="62" cy="67" r="20" fill={`url(#${id})`} />}
          <rect x="52" y="58" width="20" height="18" rx="2" fill={frame} {...INK} />
          {dim ? (
            <>
              <rect x="55.5" y="61.5" width="6" height="11" fill="var(--color-dusk)" {...THIN} />
              <rect x="62.5" y="61.5" width="6" height="11" fill="var(--color-dusk)" {...THIN} />
              <rect x="55.5" y="61.5" width="13" height="11" fill="var(--color-ink)" opacity="0.25" />
            </>
          ) : (
            <rect x="55.5" y="61.5" width="13" height="11" fill={lit ? "var(--color-lamp)" : "var(--color-ink)"} opacity={lit ? 1 : 0.55} />
          )}
          {lit && <circle cx="92" cy="62" r="13" fill={`url(#${id})`} />}
          <path d="M86 56 L98 52 V66 L86 70 Z" fill={lit ? "var(--color-lamp)" : dim ? "var(--color-dusk)" : "var(--color-ink)"} opacity={lit || dim ? 1 : 0.55} {...THIN} />
        </>
      )}
      {build && (
        <g fill="none" strokeLinecap="round">
          {/* жерди: ink-контур под слоем non */}
          {SCAFFOLD.map((d) => (
            <path key={d + "o"} d={d} style={{ stroke: "var(--color-ink)", strokeWidth: 7 }} />
          ))}
          {SCAFFOLD.map((d) => (
            <path key={d} d={d} style={{ stroke: "var(--color-non)", strokeWidth: 3 }} />
          ))}
        </g>
      )}
      {lit && (
        <g>
          <path d="M104 92 a10 10 0 0 1 20 0 Z" fill="var(--color-non)" {...INK} />
          <path d="M110 92 a4 4 0 0 1 8 0 Z" fill="var(--color-ink)" />
          <path
            d="M114 70 q-5 -5 0 -9 q5 -4 0 -9"
            fill="none"
            style={{ stroke: "var(--color-ink-muted)", strokeWidth: "var(--stroke-ink-thin)", strokeLinecap: "round" }}
          />
        </g>
      )}
    </svg>
  );
}
