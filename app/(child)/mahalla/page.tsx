"use client";
import { useT } from "@/lib/i18n";
import { graph } from "@/lib/content";
export default function Page() {
  const { t, lang } = useT();
  return (
    <>
      <h1 className="text-xl font-bold">{t("mahalla.title")}</h1>
      <ul className="flex flex-col gap-2">
        {graph.topics.map((tp) => (
          <li key={tp.id} className="border border-ink-muted bg-paper p-3">
            <b>{tp.id}</b> {tp.title[lang]} <span className="text-sm text-ink-muted">({t("mahalla.state")})</span>
          </li>
        ))}
      </ul>
    </>
  );
}
