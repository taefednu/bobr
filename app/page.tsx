"use client";
import Link from "next/link";
import { Shell } from "@/components/skeleton/Shell";
import { useT, type Key } from "@/lib/i18n";

const ROUTES: [string, Key][] = [
  ["/goal", "nav.goal"],
  ["/diagnose", "nav.diagnose"],
  ["/mahalla", "nav.mahalla"],
  ["/lesson", "nav.lesson"],
  ["/teach", "nav.teach"],
  ["/chat", "nav.chat"],
  ["/parent", "nav.parent"],
];

export default function Home() {
  const { t } = useT();
  return (
    <Shell>
      <h1 className="text-xl font-bold">{t("home.title")}</h1>
      <ul className="flex flex-col gap-2">
        {ROUTES.map(([href, k]) => (
          <li key={href}>
            <Link href={href} className="underline">{t(k)}</Link>
          </li>
        ))}
      </ul>
    </Shell>
  );
}
