"use client";

import { useT } from "@/lib/i18n";
import type { DashboardData } from "./dashboard";
import { formatParentDate } from "./view-model";

type Support = DashboardData["children"][number]["learningSupport"];
type Topic = Support["topics"][number];

export function SupportTopic({ support }: { support: Topic | undefined }) {
  const { t, lang } = useT();
  if (!support || support.tracking === "untracked") return <p className="text-label text-ink-muted">{t("parent.support.untracked")}</p>;
  const number = (value: number | null) => value === null ? t("parent.unavailable") : new Intl.NumberFormat(lang === "ru" ? "ru-RU" : "uz-Latn-UZ").format(value);
  const level = (value: number | null) => value !== null && value >= 1 && value <= 4
    ? t(`parent.support.level.${value as 1 | 2 | 3 | 4}`) : t("parent.support.noActiveTask");
  return <div className="space-y-3">
    <p className="text-label text-ink-muted">{t("parent.support.latestLesson")}</p>
    {!support.summaryComplete && <p role="note">{t("parent.support.incomplete")}</p>}
    <dl className="space-y-3">
      <div><dt className="text-label font-semibold">{t("parent.support.current")}</dt><dd>{level(support.currentEscalationLevel)}</dd></div>
      <div><dt className="text-label font-semibold">{t("parent.support.maximum")}</dt><dd>{level(support.maxEscalationLevel)}</dd></div>
      <div><dt className="text-label font-semibold">{t("parent.support.independent")}</dt><dd>{number(support.independentlySolved)}</dd></div>
      <div><dt className="text-label font-semibold">{t("parent.support.assisted")}</dt><dd>{number(support.assistedSolved)}</dd></div>
      <div><dt className="text-label font-semibold">{t("parent.support.streak")}</dt><dd>{number(support.independentStreak)}{support.independentStreak !== null ? " / 3" : ""}</dd></div>
    </dl>
  </div>;
}

export function LearningSupport({ support, titles }: { support: Support; titles: { topic: string; title: string }[] }) {
  const { t, lang } = useT();
  const tracked = support.topics.filter((topic) => topic.tracking !== "untracked");
  const title = (topic: string) => titles.find((item) => item.topic === topic)?.title ?? topic;
  const levelText = (level: number) => level >= 1 && level <= 4 ? t(`parent.support.level.${level as 1 | 2 | 3 | 4}`) : t("parent.unavailable");
  const dateText = (timestamp: number) => {
    const parts = new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "uz-Latn-UZ", {
      timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit", hourCycle: "h23", numberingSystem: "latn",
    }).formatToParts(new Date(timestamp));
    return `${formatParentDate(timestamp, lang)} ${["hour", "minute"].map((type) => parts.find((part) => part.type === type)?.value).join(":")}`;
  };
  return <section className="space-y-5 border-t-2 border-ink-muted pt-5" aria-label={t("parent.support.title")}>
    <h2 className="font-display text-title">{t("parent.support.title")}</h2>
    <p className="text-label text-ink-muted">{t("parent.support.scope")}</p>
    {tracked.length === 0 ? <p>{t("parent.support.untracked")}</p> : <div className="space-y-6">{tracked.map((topic) => <section key={topic.topicNodeId} className="space-y-3">
      <h3 className="font-semibold">{title(topic.topicNodeId)}</h3><SupportTopic support={topic} />
    </section>)}</div>}
    <h3 className="font-semibold">{t("parent.support.events")}</h3>
    {support.recentEvents.length === 0 ? <p>{tracked.length === 0 ? t("parent.support.untracked") : t("parent.support.noEvents")}</p> : <ol className="space-y-3">{support.recentEvents.map((event, index) => <li key={`${event.timestamp}-${event.topicNodeId}-${index}`} className="space-y-1">
      <p className="text-label text-ink-muted">{dateText(event.timestamp)} · {title(event.topicNodeId)}</p>
      <p>{t(event.reason === "help" ? "parent.support.help" : "parent.support.wrong")}: {levelText(event.escalationLevel)}</p>
      {event.misconceptionTag && <p className="text-label">{t(event.misconceptionTag === "added_denominators" ? "parent.support.addedDenominators" : "parent.support.noTag")}</p>}
    </li>)}</ol>}
    {support.recentEventsLimited && <p className="text-label text-ink-muted">{t("parent.support.eventsLimited")}</p>}
  </section>;
}
