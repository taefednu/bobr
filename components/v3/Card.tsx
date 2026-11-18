import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/utils";

export const V3_TONE = {
  card: "--v3-card", // баннер
  settings: "--v3-card-settings",
  ustoz: "--v3-card-ustoz", // пузырь Ustoz
  field: "--v3-field",
  warm: "--v3-card-warm", // «Советуем»
  note: "--v3-note",
  peach: "--v3-card-peach", // статистика
  circle: "--v3-circle", // круги разделов, чипы
  nav: "--v3-nav",
} as const;
export const V3_RADIUS = { banner: "--v3-r-banner", card: "--v3-r-card", stat: "--v3-r-stat", bubble: "--v3-r-bubble", nav: "--v3-r-nav" } as const;

type Props<T extends ElementType> = { as?: T; tone?: keyof typeof V3_TONE; radius?: keyof typeof V3_RADIUS } & Omit<ComponentPropsWithoutRef<T>, "as">;

/** Карточка v3: заливка по токену, мягкая тёплая тень с бликом сверху, без обводки. Остальные пропсы (data-ref, style, aria) уходят в элемент. */
export function V3Card<T extends ElementType = "div">({ as, tone = "card", radius = "card", className, style, ...rest }: Props<T>) {
  const Tag: ElementType = as ?? "div";
  return (
    <Tag
      className={cn("relative", className)}
      style={{ background: `var(${V3_TONE[tone]})`, borderRadius: `var(${V3_RADIUS[radius]})`, boxShadow: "var(--v3-shadow-card)", ...style }}
      {...rest}
    />
  );
}
