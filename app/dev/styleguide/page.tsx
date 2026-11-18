// Живой лист дизайн-системы (DESIGN.md) — только для разработки. Значения берутся из токенов
// globals.css и lib/motion.ts, не дублируются. Тексты здесь — образцы шрифта, не продуктовые строки.
import { notFound } from "next/navigation";
import { PressButton } from "@/components/ui/press-button";
import { House } from "@/components/mahalla/House";
import { TileBand } from "@/components/mahalla/TileBand";
import { MotionDemo } from "./motion-demo";

const COLORS = [
  "sand", "paper", "clay-100", "ink", "ink-muted", "lazuli", "lazuli-deep", "tile",
  "apricot", "non", "terracotta", "lamp", "garden", "dusk", "alert",
] as const;
const PIE = ["pie-1", "pie-2", "pie-3", "pie-4", "pie-5", "pie-6"] as const;
const HOUSES = ["empty", "scaffold", "built", "alive", "dimmed"] as const;
const STATES = [
  ["rest", undefined],
  ["hover", "hover"],
  ["pressed", "pressed"],
  ["focus", "focus"],
] as const;
const SHADOWS = ["rest", "lift", "clay", "well", "drop"] as const;

export default function Styleguide() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="mx-auto grid max-w-5xl gap-12 px-4 py-10 md:px-8">
      <header className="grid gap-2">
        <p className="text-label text-ink-muted">DESIGN.md v1 · /dev/styleguide</p>
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
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="grid content-start gap-2">
            <code className="text-label text-ink-muted">uz</code>
            {/* TODO: вычитка носителем */}
            <p className="font-display text-title">Oʻnta boʻlakdan uchtasi — 3/10</p>
            <p className="font-display text-display font-[650]">Kasrlarni oʻrganamiz</p>
          </div>
          <div className="grid content-start gap-2">
            <code className="text-label text-ink-muted">ru</code>
            <p className="font-display text-title">Три из десяти кусочков — 3/10</p>
            <p className="font-display text-display font-[650]">Учим дроби</p>
          </div>
        </div>
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

      <section className="grid gap-4" data-testid="buttons">
        <h2 className="font-display text-title">Buttons</h2>
        {(["primary", "secondary"] as const).map((v) => (
          <div key={v} className="grid gap-2">
            <code className="text-label text-ink-muted">{v}</code>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-5">
              {STATES.map(([name, demo]) => (
                <div key={name} className="grid justify-items-start gap-1">
                  <PressButton variant={v} demoState={demo}>Davom etish</PressButton>
                  <code className="text-label text-ink-muted">{name}</code>
                </div>
              ))}
              <div className="grid justify-items-start gap-1">
                <PressButton variant={v} disabled>Davom etish</PressButton>
                <code className="text-label text-ink-muted">disabled</code>
              </div>
            </div>
          </div>
        ))}
        <div className="grid gap-2">
          <code className="text-label text-ink-muted">live (press me)</code>
          <div className="flex flex-wrap gap-4">
            <PressButton>Davom etish</PressButton>
            <PressButton variant="secondary">Boshqa yoʻl</PressButton>
          </div>
        </div>
      </section>

      <section className="grid gap-4" data-testid="inputs">
        <h2 className="font-display text-title">Answer input &amp; card</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {(["rest", "focus"] as const).map((st) => (
            <div key={st} className="grid gap-3">
              <input
                readOnly
                defaultValue="3/10"
                aria-label={`answer ${st}`}
                className="h-[72px] w-full rounded-md bg-paper text-center font-display text-numeral tabular font-bold text-ink"
                style={{
                  border: "var(--stroke-ink) solid var(--color-ink)",
                  boxShadow: "var(--shadow-well)",
                  ...(st === "focus" && { outline: "var(--focus-ring)", outlineOffset: "var(--focus-offset)" }),
                }}
              />
              <code className="text-label text-ink-muted">{st}</code>
            </div>
          ))}
        </div>
        <div
          className="max-w-sm rounded-lg bg-paper p-6 shadow-rest"
          style={{ border: "var(--stroke-ink) solid var(--color-ink)" }}
        >
          <p className="font-display text-title">Card</p>
          <p className="text-body">Paper on sand, ink outline, soft shadow, no ledge.</p>
        </div>
        <span
          className="inline-block w-fit rounded-full bg-clay-100 px-3 py-1.5 text-label text-ink-muted"
          style={{ border: "var(--stroke-ink-thin) solid var(--color-ink)" }}
        >
          Bobr — sunʼiy intellekt va xato qilishi mumkin
        </span>
        <span
          className="inline-block w-fit rounded-full bg-clay-100 px-3 py-1.5 text-label text-ink-muted"
          style={{ border: "var(--stroke-ink-thin) solid var(--color-ink)" }}
        >
          Bobr — ИИ и может ошибаться
        </span>
      </section>

      <section className="grid gap-4" data-testid="houses">
        <h2 className="font-display text-title">Houses &amp; tile band</h2>
        <TileBand />
        <div className="flex flex-wrap gap-6">
          {HOUSES.map((h) => (
            <div key={h} className="grid justify-items-center gap-2">
              <House state={h} />
              <House state={h} size={72} />
              <code className="text-label text-ink-muted">{h}</code>
            </div>
          ))}
        </div>
      </section>

      <MotionDemo />
    </main>
  );
}
