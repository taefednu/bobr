// Живой лист дизайн-системы (DESIGN.md) — только для разработки. Значения берутся из токенов
// globals.css и lib/motion.ts, не дублируются. Тексты здесь — образцы шрифта, не продуктовые строки.
import { notFound } from "next/navigation";
import { MotionDemo } from "./motion-demo";

const COLORS = [
  "sand", "paper", "clay-100", "ink", "ink-muted", "lazuli", "lazuli-deep", "tile",
  "apricot", "non", "terracotta", "lamp", "garden", "dusk", "alert",
] as const;
const PIE = ["pie-1", "pie-2", "pie-3", "pie-4", "pie-5", "pie-6"] as const;
const HOUSES = [
  { state: "empty", fill: "var(--color-sand)", border: "2px dashed var(--color-ink-muted)" },
  { state: "scaffold", fill: "var(--color-terracotta)", border: "none" },
  { state: "built", fill: "var(--color-non)", border: "none" },
  { state: "alive", fill: "var(--color-non)", border: "none", glow: true },
  { state: "dimmed", fill: "var(--color-dusk)", border: "none" },
] as const;
const SHADOWS = ["rest", "lift", "press", "clay"] as const;

export default function Styleguide() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="mx-auto grid max-w-5xl gap-12 px-4 py-10 md:px-8">
      <header className="grid gap-2">
        <p className="text-label text-ink-muted">DESIGN.md v0 · /dev/styleguide</p>
        <h1 className="font-display text-display font-[650]">Bobr — mahalla</h1>
      </header>

      <section className="grid gap-4" data-testid="colors">
        <h2 className="font-display text-title">Colors</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {COLORS.map((c) => (
            <div key={c} className="grid gap-1">
              <div className="h-16 rounded-md shadow-rest" style={{ background: `var(--color-${c})` }} />
              <code className="text-label text-ink-muted">{c}</code>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {PIE.map((c) => (
            <div key={c} className="grid justify-items-center gap-1">
              <div className="size-12 rounded-full shadow-clay" style={{ background: `var(--color-${c})` }} />
              <code className="text-label text-ink-muted">{c}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4" data-testid="type">
        <h2 className="font-display text-title">Typography</h2>
        <p className="font-display text-display font-[650]">Kasrlarni oʻrganamiz — gʻalaba!</p>
        <p className="font-display text-title">Учим дроби вместе с Bobr</p>
        <p className="font-display text-numeral tabular font-bold">1/2 + 1/3 = 5/6</p>
        <p className="text-body max-w-[60ch]">
          Bobr — sunʼiy intellekt va xato qilishi mumkin. Oʻqituvchi Ustoz savol beradi, javobni aytmaydi.
          Bobr — ИИ и может ошибаться. Ustoz задаёт вопросы и не выдаёт ответ.
        </p>
        <p className="text-label">Label · Tugma · Кнопка</p>
      </section>

      <section className="grid gap-4" data-testid="elevation">
        <h2 className="font-display text-title">Elevation & radii</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SHADOWS.map((s) => (
            <div
              key={s}
              className="grid h-24 place-items-center rounded-lg bg-paper"
              style={{ boxShadow: `var(--shadow-${s})` }}
            >
              <code className="text-label">{s}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4" data-testid="houses">
        <h2 className="font-display text-title">House states</h2>
        <div className="flex flex-wrap gap-6">
          {HOUSES.map((h) => (
            <div key={h.state} className="grid justify-items-center gap-2">
              <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden>
                <path
                  d="M12 34 L36 12 L60 34 V62 H12 Z"
                  fill={h.state === "empty" ? "none" : h.fill}
                  stroke={h.state === "empty" ? "var(--color-ink-muted)" : "none"}
                  strokeDasharray={h.state === "empty" ? "4 4" : undefined}
                  strokeWidth="2"
                />
                {"glow" in h && h.glow ? (
                  <rect x="30" y="40" width="12" height="12" rx="2" fill="var(--color-lamp)" />
                ) : h.state !== "empty" ? (
                  <rect x="30" y="40" width="12" height="12" rx="2" fill="var(--color-ink)" opacity="0.35" />
                ) : null}
              </svg>
              <code className="text-label text-ink-muted">{h.state}</code>
            </div>
          ))}
        </div>
      </section>

      <MotionDemo />
    </main>
  );
}
