// Все состояния чата на фикстурах: /dev/v3/chat/states (сетка iframe) и ?s=<id> (одно состояние на весь кадр). В production 404.
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { States } from "./states";

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Suspense><States /></Suspense>;
}
