"use client";
import { ProfileView } from "@/components/v3/profile/ProfileView";

export function Demo() {
  return <ProfileView data={{ name: "Мадина", grade: 5, lang: "ru", goal: "improve", topics: { done: 4, total: 10 }, taught: 2 }} />;
}
