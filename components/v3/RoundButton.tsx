"use client";
import Link from "next/link";
import type { ReactNode } from "react";

const TONE = {
  teal: { background: "linear-gradient(160deg, var(--v3-teal), var(--v3-teal-strong))", color: "var(--v3-on-teal)", boxShadow: "var(--v3-shadow-round)" },
  round: { background: "linear-gradient(160deg, var(--v3-round), var(--v3-teal-strong))", color: "var(--v3-on-teal)", boxShadow: "var(--v3-shadow-round)" },
  cream: { background: "var(--v3-circle)", color: "var(--v3-ink)", boxShadow: "var(--v3-shadow-card)" },
} as const;

type Props = {
  label: string; // aria-label: у кнопки только иконка
  size?: number; // 56 по умолчанию; в шапке чата 42, дома 62
  tone?: keyof typeof TONE;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  children: ReactNode;
  className?: string;
  "data-ref"?: string;
};

/** Круглая кнопка v3 (стрелка баннера, назад, отправить). Ссылка при href, иначе button. Нажатие: scale 0.95 за 100 мс. */
export function V3RoundButton({ label, size = 56, tone = "teal", href, onClick, disabled, type = "button", children, className = "", ...rest }: Props) {
  const cls = `flex shrink-0 items-center justify-center rounded-full transition-transform duration-100 active:scale-95 disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100 ${className}`;
  const style = { width: size, height: size, ...TONE[tone] };
  const ref = rest["data-ref"];
  return href ? (
    <Link href={href} aria-label={label} data-ref={ref} className={cls} style={style}>{children}</Link>
  ) : (
    <button type={type} aria-label={label} data-ref={ref} onClick={onClick} disabled={disabled} className={`${cls} cursor-pointer`} style={style}>{children}</button>
  );
}
