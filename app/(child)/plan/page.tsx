"use client";
import { useT } from "@/lib/i18n";

export default function Page() {
  const { t } = useT();
  return <h1 className="font-display text-display font-bold">{t("plan.title")}</h1>;
}
