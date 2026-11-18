// Все состояния экрана урока v3 на фикстурах: сетка iframe и ?s=<id> (одно состояние на кадр). В production 404.
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { States } from "./states";

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Suspense><States /></Suspense>;
}
