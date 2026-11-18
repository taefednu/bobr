"use client";
import { useT } from "@/lib/i18n";

export type Who = "bobr" | "ustoz";
export type Pose = "idle";

const INK = { stroke: "var(--color-ink)", strokeWidth: "var(--stroke-ink)", strokeLinejoin: "round" } as const;

/** Квадратная коробка фиксированного размера: вёрстка не прыгает, когда придёт PNG. */
// TODO(front): PNG pose from public/<who>/<pose>.png
export function Character({ who, pose = "idle", size = 96, className = "" }: { who: Who; pose?: Pose; size?: number; className?: string }) {
  const { t } = useT();
  void pose;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={t(`char.${who}`)} className={`shrink-0 ${className}`}>
      {who === "bobr" ? (
        <g>
          <circle cx="24" cy="26" r="11" fill="var(--color-non)" {...INK} />
          <circle cx="76" cy="26" r="11" fill="var(--color-non)" {...INK} />
          <ellipse cx="50" cy="56" rx="38" ry="34" fill="var(--color-apricot)" {...INK} />
          <ellipse cx="50" cy="66" rx="16" ry="11" fill="var(--color-paper)" {...INK} />
          <ellipse cx="50" cy="61" rx="5" ry="3.5" fill="var(--color-ink)" />
          <rect x="43" y="68" width="6" height="10" rx="1.5" fill="var(--color-paper)" {...INK} strokeWidth="2" />
          <rect x="51" y="68" width="6" height="10" rx="1.5" fill="var(--color-paper)" {...INK} strokeWidth="2" />
          <circle cx="34" cy="46" r="4" fill="var(--color-ink)" />
          <circle cx="66" cy="46" r="4" fill="var(--color-ink)" />
        </g>
      ) : (
        <g>
          <path d="M50 8 L58 24 H42 Z" fill="var(--color-lazuli)" {...INK} />
          <ellipse cx="50" cy="58" rx="36" ry="34" fill="var(--color-tile)" {...INK} />
          <path d="M18 62 Q30 92 50 90 Q70 92 82 62 Q66 76 50 76 Q34 76 18 62 Z" fill="var(--color-lazuli)" {...INK} />
          <path d="M44 56 L56 56 L50 70 Z" fill="var(--color-lamp)" {...INK} />
          <circle cx="36" cy="46" r="5" fill="var(--color-paper)" {...INK} strokeWidth="2" />
          <circle cx="64" cy="46" r="5" fill="var(--color-paper)" {...INK} strokeWidth="2" />
          <circle cx="37" cy="47" r="2" fill="var(--color-ink)" />
          <circle cx="65" cy="47" r="2" fill="var(--color-ink)" />
        </g>
      )}
    </svg>
  );
}
