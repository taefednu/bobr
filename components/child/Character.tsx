"use client";
import { useT } from "@/lib/i18n";

export type Who = "bobr" | "ustoz";
export type Pose = "idle";

/** Квадратная коробка фиксированного размера: вёрстка не прыгает, поза вписана в неё целиком. */
export function Character({ who, pose = "idle", size = 96, className = "" }: { who: Who; pose?: Pose; size?: number; className?: string }) {
  const { t } = useT();
  const base = `/${who}/${pose}`;
  return (
    <picture className={`block shrink-0 ${className}`} style={{ width: size, height: size }}>
      <source srcSet={`${base}.webp`} type="image/webp" />
      {/* eslint-disable-next-line @next/next/no-img-element -- прозрачная поза, размер задаёт коробка */}
      <img src={`${base}.png`} alt={t(`char.${who}`)} width={size} height={size} draggable={false} className="size-full object-contain object-bottom" />
    </picture>
  );
}
