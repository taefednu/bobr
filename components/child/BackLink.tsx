"use client";
import Link from "next/link";
import { useT } from "@/lib/i18n";

export function BackLink({ href }: { href: string }) {
  const { t } = useT();
  return (
    <Link href={href} className="inline-flex min-h-11 w-fit items-center gap-2 text-label text-ink">
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden fill="none" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 10 H4 M9 4.5 L3.5 10 L9 15.5" />
      </svg>
      {t("child.back")}
    </Link>
  );
}
