import Fraction from "fraction.js";
import { useT } from "@/lib/i18n";

// Лепёшка из строки дроби ("2/4"), числитель и знаменатель как есть (без сокращения). Закрашенные доли равномерно по кругу.
// Второй цвет долей: токен --v3-pie-other ждёт заведения в globals.css (в отчёте: oklch(82% 0.13 75), ~#f9b65e с эталона); пока запасной токен.
const R = 52;
const GAP = 3;
const OTHER = "var(--v3-pie-other, var(--v3-card-peach))";

function slice(i: number, d: number) {
  const a0 = (i / d) * 2 * Math.PI;
  const a1 = ((i + 1) / d) * 2 * Math.PI;
  const p = (a: number) => `${(R + R * Math.sin(a)).toFixed(2)} ${(R - R * Math.cos(a)).toFixed(2)}`;
  return `M${R} ${R}L${p(a0)}A${R} ${R} 0 0 1 ${p(a1)}Z`;
}

export function V3Pie({ fraction, className, dataRef }: { fraction: string; className?: string; dataRef?: string }) {
  const { t } = useT();
  const [n, d] = fraction.split("/").map(Number);
  // ponytail: строка приходит из lib/chat/visual.ts уже проверенной; Fraction страхует от мусора, а не считает
  let ok = false;
  try { ok = Number.isInteger(n) && Number.isInteger(d) && d >= 2 && d <= 12 && new Fraction(n, d).compare(1) < 0 && n > 0; } catch {}
  if (!ok) return null;
  return (
    <svg data-ref={dataRef} role="img" aria-label={t("chatv3.pie.aria").replace("{n}", String(n)).replace("{d}", String(d))} viewBox={`0 0 ${2 * R} ${2 * R}`} className={className} style={{ filter: "drop-shadow(0 3px 4px oklch(64% 0.1 60 / 0.2))" }}>
      {Array.from({ length: d }, (_, i) => {
        const on = Math.floor(((i + 1) * n) / d) > Math.floor((i * n) / d);
        return <path key={i} d={slice(i, d)} fill={on ? "var(--v3-teal)" : OTHER} stroke="var(--v3-card-ustoz)" strokeWidth={GAP} strokeLinejoin="round" />;
      })}
    </svg>
  );
}
