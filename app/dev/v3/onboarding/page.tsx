// Фикстуры экранов входа v3: /dev/v3/onboarding?v=start|diag-add|diag-equiv|diag-part|diag-wait|diag-done|plan|plan-empty. В production 404.
import { notFound } from "next/navigation";
import { Demo } from "./demo";

export default async function Page({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  return <Demo v={(await searchParams).v ?? "start"} />;
}
