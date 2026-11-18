"use client";
import { HomeView } from "@/components/v3/home/HomeView";
import { useLang } from "@/lib/i18n";

// Фикстура как на эталоне: тема и числа приходят «из данных» теми же пропсами, что и на боевом экране.
export function Demo() {
  const lang = useLang();
  return <HomeView data={{ next: { topic: "N8", title: lang === "ru" ? "Сложение дробей" : "Kasrlarni qoʻshish", percent: 67 }, taught: 2, plan: { done: 4, total: 6 }, teachTopic: "N5" }} onStart={() => {}} onTeach={() => {}} />;
}
