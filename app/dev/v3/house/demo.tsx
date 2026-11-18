"use client";
import { HouseView, type HouseData } from "@/components/v3/house/HouseView";
import { useLang } from "@/lib/i18n";

const STATES = ["done", "current", "next", "next", "next", "next"] as const;

export function Demo() {
  const lang = useLang();
  const data: HouseData = {
    levels: STATES.map((state, i) => ({ n: i + 1, topic: `N${i + 1}`, title: `${lang === "ru" ? "Тема" : "Mavzu"} ${i + 1}`, state, canStart: true })),
  };
  return <HouseView data={data} onBack={() => {}} onStart={async () => true} />;
}
