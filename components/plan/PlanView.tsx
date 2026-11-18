"use client";
// Маршрут по махалле: дни, в каждом дне дома-стройки, соединённые пунктирной ink-дорогой (DESIGN.md §5).
// Дорога — левая колонка из отрезков: дом, отрезок до следующего. Ничего нажимаемого, кроме кнопки внизу.
import { CharacterSays } from "@/components/child/CharacterSays";
import { House } from "@/components/mahalla/House";
import { PressButton } from "@/components/ui/press-button";
import { useT } from "@/lib/i18n";
import { fill } from "@/lib/ui/fill";
import type { PlanView as Plan } from "@/lib/ui/demo-data";

type Item = Plan["days"][number]["items"][number];

const ROAD = { borderLeft: "var(--stroke-ink-thin) dashed var(--color-ink)" } as const;
const COL = "flex w-[72px] shrink-0 flex-col items-center sm:w-24";

function Road() {
  return <div aria-hidden className="min-h-4 w-0 flex-1" style={ROAD} />;
}

/** Дни плана; тема из order, которой нет ни в одном дне, добавляется в конец, чтобы ничего не пропало. */
function groups(plan: Plan): Item[][] {
  const days = plan.days.map((d) => [...d.items]);
  const seen = new Set(days.flat().map((i) => i.topic));
  const rest: Item[] = plan.order.filter((o) => !seen.has(o.topic)).map((o) => ({ ...o, kind: "new" }));
  if (rest.length) {
    if (days.length) days[days.length - 1].push(...rest);
    else days.push(rest);
  }
  return days;
}

export function PlanView({ plan, onContinue }: { plan: Plan; onContinue: () => void }) {
  const { t } = useT();
  const days = groups(plan);
  const lastDay = days.length - 1;
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 sm:pt-[4vh]">
      <h1 className="font-display text-title font-bold">{t("plan.title")}</h1>
      <CharacterSays who="ustoz">{t("plan.intro")}</CharacterSays>
      <ol className="flex flex-col">
        {days.map((items, d) => (
          <li key={d} className="flex flex-col">
            <div className="flex items-stretch gap-4 pb-2">
              <div className={COL}>{d > 0 && <Road />}</div>
              <h2 className="py-2 font-display text-title font-bold">{fill(t("plan.day"), { n: String(d + 1) })}</h2>
            </div>
            <ul className="flex flex-col">
              {items.map((item, i) => {
                const last = d === lastDay && i === items.length - 1;
                return (
                  <li key={item.topic} className="flex items-stretch gap-4">
                    <div className={COL}>
                      <div className="w-[72px] sm:w-24 [&>svg]:h-auto [&>svg]:w-full">
                        <House state="scaffold" size={72} />
                      </div>
                      {!last && <Road />}
                    </div>
                    <div className="flex flex-col items-start gap-1 pt-3 pb-6">
                      <span className="text-body font-bold">{item.title}</span>
                      {item.kind !== "new" && (
                        <span
                          className="rounded-full bg-paper px-3 text-label text-ink-muted"
                          style={{ border: "var(--stroke-ink-thin) solid var(--color-ink)" }}
                        >
                          {t(`plan.kind.${item.kind}`)}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
      <PressButton fullWidth onClick={onContinue}>{t("plan.toMahalla")}</PressButton>
    </div>
  );
}
