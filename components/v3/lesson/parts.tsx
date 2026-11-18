"use client";
// Детали экрана урока v3: дробь стопкой, лепёшка/полоска/прямая из данных сервера, кнопки-пилюли, экран кризиса.
// Здесь нет вычислений ответа: k и n берутся из строки "k/n", которую прислал сервер, и идут только в геометрию.
import { motion } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/lib/i18n";
import { useMotion, VIZ, vizDelayMs } from "@/lib/motion";
import { afterQueueMs, sliceAnim, vizAnim } from "@/components/v3/motion";
import { parseFraction, r2 } from "@/lib/ui/parseFraction";

/** Дробь стопкой «число / черта / число». Не дробь ("?/6" с пропуском тоже) — просто текст. */
export function V3Fraction({ value, size = 44, className = "" }: { value: string; size?: number; className?: string }) {
  const m = /^(\d+|\?)\/(\d+)$/.exec(value);
  const font = { font: `800 ${size}px/1 var(--font-sans)` } as const;
  if (!m) return <span className={`tabular-nums ${className}`} style={font}>{value}</span>;
  return (
    <span role="img" aria-label={value} className={`inline-flex flex-col items-center tabular-nums ${className}`} style={font}>
      <span aria-hidden>{m[1]}</span>
      <span aria-hidden className="block w-full min-w-[1.1em] rounded-full" style={{ height: Math.max(3, size / 11), margin: `${size / 9}px 0`, background: "currentColor" }} />
      <span aria-hidden>{m[2]}</span>
    </span>
  );
}

const ON = "var(--v3-teal)";
const OFF = "var(--v3-pie-other)";
const GAP_STROKE = "var(--v3-card)";

/** Лепёшка: первые k долей закрашены. */
export function V3LessonPie({ value, size = 124 }: { value: string; size?: number }) {
  const { t } = useT();
  const f = parseFraction(value);
  if (!f || f.k > f.n) return null;
  const { k, n } = f;
  const R = 50;
  const p = (a: number) => `${r2(52 + R * Math.sin(a))} ${r2(52 - R * Math.cos(a))}`;
  return (
    <svg role="img" aria-label={t("lessonv3.pie.aria")} viewBox="0 0 104 104" width={size} height={size} className="max-w-full" style={{ filter: "drop-shadow(0 3px 4px oklch(64% 0.1 60 / 0.2))" }}>
      {n === 1 ? (
        <circle cx="52" cy="52" r={R} className="v3-viz" style={sliceAnim(0, 1, k > 0)} fill={k ? ON : OFF} />
      ) : (
        Array.from({ length: n }, (_, i) => (
          <path key={i} d={`M52 52L${p((i / n) * 2 * Math.PI)}A${R} ${R} 0 0 1 ${p(((i + 1) / n) * 2 * Math.PI)}Z`} className="v3-viz" style={sliceAnim(i, n, i < k)} fill={i < k ? ON : OFF} stroke={GAP_STROKE} strokeWidth="3" strokeLinejoin="round" />
        ))
      )}
    </svg>
  );
}

/** Полоска из n клеток, k закрашены. */
export function V3LessonStrip({ value, size = 300 }: { value: string; size?: number }) {
  const { t } = useT();
  const f = parseFraction(value);
  if (!f || f.k > f.n) return null;
  const { k, n } = f;
  const W = 300;
  const H = 44;
  const gap = 4;
  const w = (W - gap * (n - 1)) / n;
  return (
    <svg role="img" aria-label={t("lessonv3.strip.aria")} viewBox={`0 0 ${W} ${H}`} width={size} height={r2((size * H) / W)} className="h-auto max-w-full" style={{ filter: "drop-shadow(0 3px 4px oklch(64% 0.1 60 / 0.18))" }}>
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={r2(i * (w + gap))} y="0" width={r2(w)} height={H} rx={Math.min(12, w / 2)} className="v3-viz" style={sliceAnim(i, n, i < k)} fill={i < k ? ON : OFF} />
      ))}
    </svg>
  );
}

/** Прямая 0…max: деления по знаменателю первой дроби, бусина на каждую дробь. */
export function V3LessonLine({ values }: { values: string[] }) {
  const { t } = useT();
  const { reduced, transitions } = useMotion();
  const W = 320;
  const PAD = 18;
  const Y = 26;
  const fr = values.flatMap((v) => {
    const f = parseFraction(v);
    return f ? [{ v, ...f }] : [];
  });
  if (!fr.length) return null;
  const max = Math.max(1, ...fr.map(({ k, n }) => Math.ceil(k / n)));
  const den = fr[0].n;
  if (den * max > 120) return null;
  const x = (k: number, n: number) => r2(PAD + (k / n / max) * (W - 2 * PAD));
  return (
    <svg role="img" aria-label={t("lessonv3.line.aria")} viewBox={`0 0 ${W} 70`} width={W} height={70} className="h-auto max-w-full">
      <line x1={PAD} y1={Y} x2={W - PAD} y2={Y} className="v3-viz" style={vizAnim({ name: "in", ms: VIZ.inMs, delayMs: VIZ.startMs })} stroke="var(--v3-ink-soft)" strokeWidth="4" strokeLinecap="round" />
      {Array.from({ length: den * max + 1 }, (_, i) => {
        const whole = i % den === 0;
        return <line key={i} x1={x(i, den)} x2={x(i, den)} y1={whole ? Y - 11 : Y - 6} y2={whole ? Y + 11 : Y + 6} className="v3-viz" style={vizAnim({ name: "in", ms: VIZ.inMs, delayMs: vizDelayMs(i, den * max + 1) })} stroke="var(--v3-ink-soft)" strokeWidth="2" strokeLinecap="round" />;
      })}
      {Array.from({ length: max + 1 }, (_, i) => (
        <text key={i} x={x(i, 1)} y={Y + 32} textAnchor="middle" fontSize="16" fontWeight="700" className="v3-viz" style={{ fill: "var(--v3-ink)", fontFamily: "var(--font-sans)", ...vizAnim({ name: "in", ms: VIZ.inMs, delayMs: vizDelayMs(i * den, den * max + 1) }) }}>{i}</text>
      ))}
      {fr.map(({ v, k, n }) => (
        <motion.circle key={v} cy={Y} r="10" className="v3-viz" style={vizAnim({ name: "in", ms: VIZ.inMs, delayMs: VIZ.startMs })} fill={ON} stroke="var(--v3-card)" strokeWidth="3" initial={{ cx: x(0, 1) }} animate={{ cx: x(k, n) }} transition={{ ...transitions.move, delay: reduced ? 0 : afterQueueMs(den * max + 1) / 1000 }} />
      ))}
    </svg>
  );
}

/** Кнопка-пилюля. primary: бирюзовая, во всю ширину, одна на экран. soft: чип второго плана. */
export function V3Pill({ children, tone = "primary", type = "button", disabled, onClick, dataRef }: { children: ReactNode; tone?: "primary" | "soft"; type?: "button" | "submit"; disabled?: boolean; onClick?: () => void; dataRef?: string }) {
  const primary = tone === "primary";
  return (
    <button
      type={type}
      data-ref={dataRef}
      disabled={disabled}
      onClick={onClick}
      className={`${primary ? "v3-type-card h-[60px] w-full rounded-full px-6" : "v3-type-label min-h-11 rounded-full px-[19px]"} flex cursor-pointer items-center justify-center transition-transform duration-100 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--v3-teal-strong)] disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100`}
      style={primary
        ? { background: "linear-gradient(160deg, var(--v3-teal), var(--v3-teal-strong))", color: "var(--v3-on-teal)", boxShadow: "var(--v3-shadow-round)" }
        : { background: "var(--v3-circle)", color: "var(--v3-ink)", boxShadow: "var(--v3-shadow-card)" }}
    >
      {children}
    </button>
  );
}

/** Кризис: весь экран поверх урока, спокойно и без движения. Текст и номера только от сервера (view.crisis); строка про ИИ остаётся. */
export function V3Crisis({ crisis, onLeave }: { crisis: { text: string; numbers: string[] }; onLeave: () => void }) {
  const { t } = useT();
  const btn = useRef<HTMLDivElement>(null);
  useEffect(() => { btn.current?.querySelector("button")?.focus(); }, []);
  // портал: предок с transform превратил бы fixed в «внутри предка»
  return createPortal(
    <div role="alertdialog" aria-modal="true" aria-label={t("lessonv3.crisis.aria")} className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 px-6 text-center" style={{ background: "var(--v3-bg)", color: "var(--v3-ink)" }}>
      <p role="note" className="v3-type-caption" style={{ color: "var(--v3-ink-soft)" }}>{t("chatv3.ai.ustoz")}</p>
      <img src="/v3/avatar-ustoz.png" alt="" aria-hidden width={88} height={88} className="size-[88px] rounded-full" style={{ background: "var(--v3-avatar)", boxShadow: "var(--v3-shadow-card)" }} />
      <p className="v3-type-banner max-w-[340px]">{crisis.text}</p>
      <p className="v3-type-card">{t("lesson.crisis.call")} {crisis.numbers.join(", ")}</p>
      <div ref={btn} className="w-full max-w-[340px]"><V3Pill onClick={onLeave}>{t("lesson.crisis.back")}</V3Pill></div>
    </div>,
    document.body,
  );
}
