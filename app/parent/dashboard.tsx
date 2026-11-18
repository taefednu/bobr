"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { FunctionReturnType } from "convex/server";
import { motion } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { House } from "@/app/dev/styleguide/house";
import { AiBadge } from "@/components/skeleton/Shell";
import { PressButton } from "@/components/ui/press-button";
import { setLang, useT, type Key } from "@/lib/i18n";
import { useMotion } from "@/lib/motion";
import { daysUntilTest, formatParentDate, knownHouseState, nextTopicDay } from "./view-model";
import { LearningSupport, SupportTopic } from "./support";

export type DashboardData = FunctionReturnType<typeof api.parent.dashboard>;
const TABS = ["mahalla", "path", "week", "settings"] as const;
const GOALS: Record<string, Key> = { test_soon: "parent.goal.test_soon", improve: "parent.goal.improve", just_practice: "parent.goal.just_practice", homework: "parent.goal.improve", unknown: "parent.goal.just_practice" };
const PLAN_KINDS: Record<string, Key> = { new: "parent.plan.new", review: "parent.plan.review", mixed_check: "parent.plan.mixed_check" };

export function ParentFrame({ children }: { children: ReactNode }) {
  const { t } = useT();
  return <div className="min-h-dvh bg-sand text-ink">
    <header className="sticky top-0 z-10 border-b-2 border-ink bg-sand px-4 py-3">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3"><span className="font-display text-title">{t("app.name")}</span><AiBadge /></div>
    </header>
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">{children}</main>
    <footer className="mx-auto max-w-4xl px-4 pb-6 text-label text-ink-muted">{t("parent.note")}</footer>
  </div>;
}

export function ParentDashboard({ data, preview = false }: { data: DashboardData; preview?: boolean }) {
  const { t, lang } = useT();
  const { transitions, targets } = useMotion();
  const [selected, setSelected] = useState(0);
  const [tab, setTab] = useState<typeof TABS[number]>("mahalla");
  const [topic, setTopic] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { if (!preview) setLang(data.parent.lang); }, [data.parent.lang, preview]);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const child = data.children[Math.min(selected, Math.max(0, data.children.length - 1))];
  const locale = lang === "ru" ? "ru-RU" : "uz-Latn-UZ";
  const dateText = (date: string | number) => formatParentDate(date, lang) ?? t("parent.unavailable");
  const stateText = (state: string) => t(`parent.state.${knownHouseState(state) ?? "unknown"}`);
  const dayCount = now === null ? null : daysUntilTest(data.parent.testDate, now);
  const today = now === null ? null : new Date(now + 5 * 3600_000).toISOString().slice(0, 10);
  const house = child?.mahalla.find((item) => item.topic === topic);
  const nextDay = child ? nextTopicDay(child.plan.days, topic, today) : null;
  const topicSupport = child?.learningSupport.topics.find((item) => item.topicNodeId === topic);
  return <>
    {preview && <p className="rounded-md border-2 border-ink bg-clay-100 p-3" role="note">{t("parent.preview")}</p>}
    {data.children.length > 1 && <label className="flex flex-col gap-2 text-label">{t("parent.chooseChild")}
      <select className="min-h-12 rounded-md border-2 border-ink bg-paper px-3" value={Math.min(selected, data.children.length - 1)} onChange={(event) => { setSelected(Number(event.target.value)); setTopic(null); }}>
        {data.children.map((item, index) => <option key={index} value={index}>{item.displayName ?? `${t("parent.child")} ${index + 1}`}</option>)}
      </select>
    </label>}
    <nav aria-label={t("parent.title")} className="grid grid-cols-2 gap-2 sm:grid-cols-4">{TABS.map((item) => <button key={item} type="button" aria-current={tab === item ? "page" : undefined}
      className={`min-h-12 rounded-full border-2 border-ink px-4 py-2 text-label ${tab === item ? "bg-lazuli text-paper" : "bg-paper hover:bg-clay-100"}`}
      onClick={() => { setTab(item); setTopic(null); }}>{t(`parent.${item}`)}</button>)}</nav>
    {!child ? <p>{t("parent.noChildren")}</p> : <>
      <section className="space-y-2 border-b-2 border-ink-muted pb-5">
        <h1 className="font-display text-title">{child.displayName ?? t("parent.child")}</h1>
        <p>{t("parent.taughtCount")}: <strong className="tabular">{new Intl.NumberFormat(locale).format(child.topics.filter((item) => item.level === "taught_bobr").length)}</strong></p>
        <p className="text-label text-ink-muted">{data.parent.testDate ? `${t("parent.testDate")}: ${dateText(data.parent.testDate)}` : t("parent.noTestDate")}</p>
        {dayCount !== null && <p className="text-label">{t("parent.daysLeft")}: {new Intl.NumberFormat(locale).format(dayCount)}</p>}
      </section>
      {tab === "mahalla" && <section className="space-y-5" aria-label={t("parent.mahalla")}>
        <p className="text-label text-ink-muted">{t("parent.live")}</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">{child.mahalla.map((item) => {
          const state = knownHouseState(item.state);
          return <button type="button" key={item.topic} onClick={() => setTopic(item.topic)} aria-expanded={topic === item.topic}
            className="flex min-w-0 flex-col items-center gap-2 rounded-lg border-2 border-transparent p-2 text-center hover:border-ink-muted focus-visible:border-lazuli">
            <motion.span key={item.state} initial={{ opacity: 0, scale: targets.appearFromScale }} animate={{ opacity: 1, scale: 1 }} transition={transitions.appear}>
              {state ? <House state={state} size={120} /> : <span className="block h-24">{t("parent.unavailable")}</span>}
            </motion.span><span className="text-label font-semibold">{item.title}</span><span className="text-label text-ink-muted">{stateText(item.state)}</span>
          </button>;
        })}</div>
        {house && <section key={`${selected}-${house.topic}`} className="space-y-4 rounded-lg border-2 border-ink bg-paper p-5 shadow-rest" aria-label={house.title}>
          <h2 className="font-display text-title">{house.title}</h2><p>{stateText(house.state)}</p>
          <dl className="space-y-3">
            <div><dt className="text-label font-semibold">{t("parent.learnedAt")}</dt><dd>{t("parent.unavailable")}</dd></div>
            <div><dt className="text-label font-semibold">{t("parent.commonError")}</dt><dd>{t(topicSupport?.latestMisconceptionTag === "added_denominators" ? "parent.support.addedDenominators" : "parent.support.noTag")}</dd></div>
            <div><dt className="text-label font-semibold">{t("parent.nextStep")}</dt><dd>{nextDay ? dateText(nextDay.date) : t("parent.unavailable")}</dd></div>
          </dl><SupportTopic support={topicSupport} /><PressButton variant="secondary" onClick={() => setTopic(null)}>{t("parent.closeTopic")}</PressButton>
        </section>}
      </section>}
      {tab === "path" && <section className="space-y-4" aria-label={t("parent.path")}>
        {child.plan.days.length === 0 && <p>{t("parent.pathEmpty")}</p>}
        <ol className="space-y-4">{child.plan.days.map((day) => <li key={day.date} className={`rounded-lg border-2 p-5 ${day.date === today ? "border-lazuli bg-paper" : "border-ink-muted"}`}>
          <h2 className="mb-3 font-semibold">{dateText(day.date)}{day.date === today ? ` · ${t("parent.today")}` : ""}</h2>
          <ul className="space-y-2">{day.items.map((item, index) => <li key={`${item.topic}-${item.kind}-${index}`}>{child.mahalla.find((entry) => entry.topic === item.topic)?.title ?? item.topic}: {t(PLAN_KINDS[item.kind] ?? "parent.unavailable")}</li>)}</ul>
        </li>)}</ol>
      </section>}
      {tab === "week" && <section className="space-y-6" aria-label={t("parent.week")}>
        <dl className="grid gap-5 sm:grid-cols-2">
          <div><dt>{t("parent.week.solvedSelf")}</dt><dd className="mt-2 font-display text-numeral tabular">{new Intl.NumberFormat(locale).format(child.week.solvedSelf)}</dd></div>
          <div><dt>{t("parent.week.taughtBobr")}</dt><dd className="mt-2 font-display text-numeral tabular">{new Intl.NumberFormat(locale).format(child.week.taughtBobr)}</dd></div>
        </dl>
        <div><h2 className="mb-2 font-semibold">{t("parent.week.newTopics")}</h2>{child.week.newTopics.length ? <ul className="list-inside list-disc space-y-1">{child.week.newTopics.map((item) => <li key={item.topic}>{item.title}</li>)}</ul> : <p>{t("parent.week.noTopics")}</p>}</div>
        <dl className="space-y-4">{([
          ["parent.week.lastActive", child.week.lastActive === null ? t("parent.unavailable") : dateText(child.week.lastActive)],
          ["parent.week.minutes", t("parent.unavailable")], ["parent.week.summary", t("parent.unavailable")],
        ] as [Key, string][]).map(([label, value]) => <div key={label}><dt className="font-semibold">{t(label)}</dt><dd>{value}</dd></div>)}</dl>
        <dl className="grid gap-5 sm:grid-cols-2">
          {(["independent", "assisted"] as const).map((kind) => {
            const count = child.week.socratic?.[kind === "independent" ? "independentlySolved" : "assistedSolved"];
            return <div key={kind}><dt>{t(`parent.support.${kind}`)}</dt><dd className="font-semibold">{count === undefined ? t("parent.support.untracked") : new Intl.NumberFormat(locale).format(count)}</dd></div>;
          })}
        </dl>
        <LearningSupport support={child.learningSupport} titles={child.mahalla} />
      </section>}
    </>}
    {tab === "settings" && <section className="space-y-6" aria-label={t("parent.settings")}>
      <div><h2 className="font-semibold">{t("parent.goal")}</h2><p>{t(GOALS[data.parent.goal ?? ""] ?? "parent.goalNotSet")}</p><p className="mt-2 text-label text-ink-muted">{t("parent.changeGoal")}</p></div>
      <div role="group" aria-label={t("parent.displayLanguage")}><h2 className="mb-3 font-semibold">{t("parent.displayLanguage")}</h2><div className="flex flex-wrap gap-3">{(["uz", "ru"] as const).map((value) => <button type="button" key={value} aria-pressed={lang === value} onClick={() => setLang(value)} className={`min-h-12 rounded-full border-2 border-ink px-5 ${lang === value ? "bg-clay-100" : "bg-paper"}`}>{t(`lang.${value}`)}</button>)}</div></div>
      <div><h2 className="font-semibold">{t("parent.notifications")}</h2><p>{t("parent.unavailable")}</p></div>
      <div><h2 className="font-semibold">{t("parent.chatLimits")}</h2><p>{t("parent.unavailable")}</p></div>
      <div><h2 className="font-semibold">{t("parent.delete")}</h2><p>{t("parent.deleteHint")}</p></div>
      <div><h2 className="font-semibold">{t("parent.childSees")}</h2><p className="mt-2">{t("parent.childSeesText")}</p></div>
      <p className="border-t-2 border-ink-muted pt-5 text-label text-ink-muted">{t("parent.payment")}</p>
    </section>}
  </>;
}
