// Круглый портрет собеседника: голова из позы idle (фон-картинка, без новых ассетов).
import type { Partner } from "./model";

const CROP: Record<Partner, { size: string; pos: string; bg: string }> = {
  bobr: { size: "160% auto", pos: "58% 0%", bg: "var(--color-apricot)" },
  ustoz: { size: "200% auto", pos: "46% 0%", bg: "var(--color-tile)" },
};

export function Portrait({ who, size }: { who: Partner; size: number }) {
  const c = CROP[who];
  return (
    <span
      aria-hidden
      className="block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        border: "var(--stroke-ink-thin) solid var(--color-ink)",
        backgroundColor: c.bg,
        backgroundImage: `url(/${who}/idle.webp)`,
        backgroundSize: c.size,
        backgroundPosition: c.pos,
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}
