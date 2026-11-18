"use client";

import graph from "@/content/graph.json";
import { useT } from "@/lib/i18n";
import { ParentDashboard, ParentFrame, type DashboardData } from "../dashboard";

export default function Preview() {
  const { lang } = useT();
  const states = ["alive", "built", "empty", "empty", "scaffold", "scaffold", "dimmed", "alive", "scaffold", "empty"] as const;
  type Topic = DashboardData["children"][number]["mahalla"][number]["topic"];
  const mahalla = graph.topics.map((topic, index) => ({ topic: topic.id as Topic, title: topic.title[lang], state: states[index] }));
  const data: DashboardData = {
    parent: { firstName: null, lang, goal: "test_soon", testDate: "2026-11-21" },
    children: [
      {
        displayName: "Demo 1", mahalla,
        topics: mahalla.filter((topic) => topic.state !== "empty").map((topic) => ({ topic: topic.topic, title: topic.title, level: topic.state === "alive" ? "taught_bobr" : topic.state === "built" ? "solved_self" : "gap" })),
        plan: { order: ["N8", "N6", "N5", "N9"], days: [
          { date: "2026-11-18", items: [{ topic: "N8", kind: "new" }, { topic: "N6", kind: "new" }] },
          { date: "2026-11-19", items: [{ topic: "N5", kind: "new" }, { topic: "N9", kind: "new" }] },
          { date: "2026-11-20", items: [{ topic: "N9", kind: "mixed_check" }] },
        ] },
        week: { solvedSelf: 3, taughtBobr: 2, newTopics: mahalla.slice(0, 2).map(({ topic, title }) => ({ topic, title })), lastActive: Date.parse("2026-11-18T07:00:00Z") },
      },
      { displayName: "Demo 2", mahalla: mahalla.map((topic) => ({ ...topic, state: "empty" })), topics: [], plan: { order: [], days: [] }, week: { solvedSelf: 0, taughtBobr: 0, newTopics: [], lastActive: null } },
    ],
  };
  return <ParentFrame><ParentDashboard data={data} preview /></ParentFrame>;
}
