"use client";
// Маршрут ребёнка в языке v3: дни, в каждом темы-уровни дома. Данные только из plan:view, ничего нарисованного от себя.
// Нажимаемое одно: кнопка внизу (plan:accept, дальше /home).
import { motion } from "framer-motion";
import { V3Card } from "@/components/v3";
import { useReveal } from "@/components/v3/motion";
import { IconHouse } from "@/components/v3/icons";
import { Cta, Note, OnboardScreen, Rise, Say } from "@/components/v3/onboarding/parts";
import { useT, type Key } from "@/lib/i18n";
import { fill } from "@/lib/ui/fill";
import type { PlanView as Plan } from "@/lib/ui/types";

type Item = Plan["days"][number]["items"][number];

/** "2026-11-20" в словах ребёнка («20 ноября», «20-noyabr») из i18n, не из Intl: у браузеров нет месяцев на uz. Не дата, пустая строка. */
function dateText(iso: string, t: ReturnType<typeof useT>["t"]) {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(iso);
  const month = m ? Number(m[1]) : 0;
  if (!m || month < 1 || month > 12) return "";
  return fill(t("onboard.date"), { d: String(Number(m[2])), m: t(`onboard.month.${month}` as Key) });
}

/** Дни плана; тема из order, которой нет ни в одном дне, добавляется в конец, чтобы ничего не пропало. */
function groups(plan: Plan): { date: string; items: Item[] }[] {
  const days = plan.days.map((d) => ({ date: d.date, items: [...d.items] }));
  const seen = new Set(days.flatMap((d) => d.items).map((i) => i.topic));
  const rest: Item[] = plan.order.filter((o) => !seen.has(o.topic)).map((o) => ({ ...o, kind: "new" }));
  if (rest.length) {
    if (days.length) days[days.length - 1].items.push(...rest);
    else days.push({ date: "", items: rest });
  }
  return days;
}

export function PlanView({ plan, failed, onContinue }: { plan: Plan; failed?: boolean; onContinue: () => void }) {
  const { t } = useT();
  const days = groups(plan);
  const reveal = useReveal();
  let k = 1; // 0 — реплика Ustoz; дальше карточки тем по порядку, каскад кончается в REVEAL.maxS
  const test = plan.testDate ? dateText(plan.testDate, t) : "";
  return (
    <OnboardScreen cta={<Cta onClick={onContinue}>{t("onboard.plan.go")}</Cta>}>
      <div>
        <h1 className="v3-type-screen">{t("plan.title")}</h1>
        {test && (
          <p data-ref="test" className="v3-type-label mt-2 inline-block rounded-full px-4 py-1.5" style={{ background: "var(--v3-note)", boxShadow: "var(--v3-shadow-card)" }}>
            {fill(t("onboard.plan.test"), { date: test })}
          </p>
        )}
      </div>
      <Rise><Say who="ustoz">{t("onboard.plan.intro")}</Say></Rise>
      <ol className="flex flex-col gap-5">
        {days.map((day, d) => {
          const when = day.date ? dateText(day.date, t) : "";
          return (
            <li key={d} className="flex flex-col gap-3">
              <h2 className="v3-type-section flex flex-wrap items-baseline gap-x-3">
                <span>{fill(t("plan.day"), { n: String(d + 1) })}</span>
                {when && <span className="v3-type-caption" style={{ color: "var(--v3-ink-soft)" }}>{when}</span>}
              </h2>
              <ul className="flex flex-col gap-3">
                {day.items.map((item) => (
                  <li key={item.topic}>
                    <V3Card as={motion.div} {...reveal(k++)} radius="stat" className="flex items-center gap-3 p-3">
                      <span aria-hidden className="flex size-[42px] shrink-0 items-center justify-center rounded-full"
                        style={{ background: "linear-gradient(160deg, var(--v3-teal), var(--v3-teal-strong))", color: "var(--v3-on-teal)", boxShadow: "var(--v3-shadow-round)" }}>
                        <IconHouse size={22} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                        <span className="v3-type-label text-[17px] break-words">{item.title}</span>
                        {item.kind !== "new" && (
                          <span className="v3-type-caption rounded-full px-3" style={{ background: "var(--v3-circle)", color: "var(--v3-ink-soft)" }}>{t(`plan.kind.${item.kind}`)}</span>
                        )}
                      </span>
                    </V3Card>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
      {failed && <Note>{t("lesson.error")}</Note>}
    </OnboardScreen>
  );
}
