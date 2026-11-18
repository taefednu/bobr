"use client";
import Link from "next/link";
import { useT } from "@/lib/i18n";

/** Знак Bobr: морда из idle.webp в apricot-круге. Единственное место, где Bobr стоит в хроме. */
export function Logo({ size = 44 }: { size?: number }) {
  const { t } = useT();
  return (
    <Link
      href="/"
      aria-label={t("app.name")}
      className="relative block shrink-0 overflow-hidden rounded-full bg-apricot"
      style={{ width: size, height: size, border: "var(--stroke-ink-thin) solid var(--color-ink)" }}
    >
      {/* кадр (130,0)-(350,220) из исходника 443x600: морда без хвоста; тот же кроп, что в app/icon.png */}
      <img
        src="/bobr/idle.webp"
        alt=""
        draggable={false}
        className="absolute max-w-none"
        style={{ width: size * (443 / 220), left: -size * (130 / 220), top: 0 }}
      />
    </Link>
  );
}
