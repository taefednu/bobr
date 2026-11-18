import { Fraction } from "@/components/child/Fraction";
import { parseFraction, r2 } from "@/lib/ui/parseFraction";

const W = 300;
const H = 44;
const GAP = 3; // шов: фон tile виден между клетками

/** Полоска-мозаика: ink-контур, швы tile, k клеток apricot, остальные paper. */
export function Strip({ value, size = W }: { value: string; size?: number }) {
  const f = parseFraction(value);
  if (!f || f.k > f.n) return null;
  const { k, n } = f;
  const w = (W - GAP) / n;
  return (
    <figure className="flex max-w-full flex-col items-center gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} width={size} height={r2((size * H) / W)} role="img" aria-label={value} className="h-auto max-w-full">
        <rect x="1.5" y="1.5" width={W - 3} height={H - 3} rx="10" fill="var(--color-tile)" style={{ stroke: "var(--color-ink)", strokeWidth: "var(--stroke-ink)" }} />
        {Array.from({ length: n }, (_, i) => (
          <rect
            key={i}
            x={r2(GAP + i * w)}
            y={GAP + 1.5}
            width={r2(w - GAP)}
            height={H - 2 * GAP - 3}
            rx="5"
            fill={i < k ? "var(--color-apricot)" : "var(--color-paper)"}
            style={{ stroke: "var(--color-ink)", strokeWidth: "var(--stroke-ink-thin)" }}
          />
        ))}
      </svg>
      <Fraction value={value} className="text-title" />
    </figure>
  );
}
