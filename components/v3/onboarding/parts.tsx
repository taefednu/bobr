"use client";
// Общие куски экранов входа (/start, /diagnose, /plan) в языке v3: колонка, реплика Ustoz, кнопка действия,
// спокойная заметка об ошибке, дробь и лепёшка пробы. Движение из lib/motion.ts, цвета только --v3-*.
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { V3Card, V3Screen } from "@/components/v3";
import { Avatar, V3Typing } from "@/components/v3/chat/Bubbles";
import { useT } from "@/lib/i18n";
import { useMotion } from "@/lib/motion";
import { Alive, sliceAnim } from "@/components/v3/motion";

/** Колонка экрана входа. `cta` — единственное главное действие, прижато к низу поверх мягкого затухания фона. */
export function OnboardScreen({ children, cta }: { children: ReactNode; cta?: ReactNode }) {
  return (
    <V3Screen>
      <div className="flex flex-1 flex-col gap-4 pt-6 pb-6">{children}</div>
      {cta && (
        <div className="sticky bottom-0 z-10 -mx-4 px-4 pt-3 pb-5" style={{ background: "linear-gradient(to top, var(--v3-bg-bottom) 65%, transparent)" }}>
          {cta}
        </div>
      )}
    </V3Screen>
  );
}

/** Появление блока: opacity и сдвиг на 10 px по `appear`; при reduced на месте сразу. Не блокирует ввод. */
export function Rise({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const { reduced, transitions } = useMotion();
  return (
    <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { ...transitions.appear, delay: reduced ? 0 : delay } }}>
      {children}
    </motion.div>
  );
}

const CTA_STYLE = {
  background: "linear-gradient(160deg, var(--v3-teal), var(--v3-teal-strong))",
  color: "var(--v3-title)", // тёмный текст: белый на бирюзе даёт контраст ниже 3:1
  boxShadow: "var(--v3-shadow-round)",
} as const;

/** Главная кнопка экрана: на всю ширину, 56 px, нажатие scale 0.97 за 100 мс. */
export function Cta({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} data-ref="cta"
      className="v3-type-section flex h-14 w-full cursor-pointer items-center justify-center rounded-full px-6 text-[19px] transition-transform duration-100 active:scale-[0.97] disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100"
      style={CTA_STYLE}>
      {children}
    </button>
  );
}

/** Реплика Ustoz или Bobr: аватар и тёплый пузырь. Текст только как текст. */
export function Say({ who, children }: { who: "ustoz" | "bobr"; children: ReactNode }) {
  return (
    <div className="flex items-start gap-[9px]">
      <div className="mt-1"><Alive who={who}><Avatar who={who} size={52} /></Alive></div>
      <V3Card tone="ustoz" radius="bubble" className="v3-type-chat min-w-0 flex-1 px-5 py-3 break-words">{children}</V3Card>
    </div>
  );
}

/** Ждём ответ: точки в пузыре собеседника. */
export function Waiting({ who, failed }: { who: "ustoz" | "bobr"; failed?: boolean }) {
  const { t } = useT();
  return (
    <OnboardScreen>
      <ul><V3Typing who={who} label={t(who === "bobr" ? "teach.thinking" : "lesson.thinking")} /></ul>
      {failed && <Note>{t("lesson.error")}</Note>}
    </OnboardScreen>
  );
}

/** Сбой запроса: спокойная карточка, без красного. Ребёнок нажимает ещё раз. */
export function Note({ children }: { children: ReactNode }) {
  return (
    <V3Card tone="note" radius="stat" role="alert" className="v3-type-label px-5 py-3">{children}</V3Card>
  );
}

/** Дробь "k/n" стопкой: числитель, черта, знаменатель. Не дробь (или "?/n") показывает как есть. */
export function V3Frac({ value, size }: { value: string; size: number }) {
  const m = /^(\d+|\?)\/(\d+)$/.exec(value);
  const style = { fontSize: size, lineHeight: 1 } as const;
  if (!m) return <span className="font-extrabold tabular-nums" style={style}>{value}</span>;
  return (
    <span role="img" aria-label={value} className="inline-flex flex-col items-center font-extrabold tabular-nums" style={style}>
      <span aria-hidden>{m[1]}</span>
      <span aria-hidden className="my-[0.12em] block h-[0.09em] w-full min-w-[1.1em] rounded-full" style={{ background: "currentColor" }} />
      <span aria-hidden>{m[2]}</span>
    </span>
  );
}

const R = 52;
const slice = (i: number, d: number) => {
  const p = (a: number) => `${(R + R * Math.sin(a)).toFixed(2)} ${(R - R * Math.cos(a)).toFixed(2)}`;
  return `M${R} ${R}L${p((i / d) * 2 * Math.PI)}A${R} ${R} 0 0 1 ${p(((i + 1) / d) * 2 * Math.PI)}Z`;
};

/**
 * Лепёшка пробы «какая часть закрашена». Своя, а не V3Pie из чата: у той подпись для читалки называет дробь,
 * а здесь дробь и есть ответ. Закрашено k долей из n подряд от вертикали.
 */
export function ProbePie({ value, label }: { value: string; label: string }) {
  const m = /^(\d+)\/(\d+)$/.exec(value);
  const k = m ? Number(m[1]) : 0;
  const n = m ? Number(m[2]) : 0;
  if (!m || n < 2 || n > 24 || k > n) return null;
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${2 * R} ${2 * R}`} className="block size-[148px]" style={{ filter: "drop-shadow(0 3px 4px oklch(64% 0.1 60 / 0.2))" }}>
      {Array.from({ length: n }, (_, i) => (
        <path key={i} d={slice(i, n)} className="v3-viz" style={sliceAnim(i, n, i < k)} fill={i < k ? "var(--v3-teal)" : "var(--v3-pie-other)"} stroke="var(--v3-card)" strokeWidth={3} strokeLinejoin="round" />
      ))}
    </svg>
  );
}
