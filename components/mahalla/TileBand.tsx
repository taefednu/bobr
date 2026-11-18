/** Тонкая полоса плитки (≤ 16 px): простой геометрический узор, один раз на экран. */
export function TileBand() {
  return (
    <svg width="100%" height="16" aria-hidden className="block">
      <defs>
        <pattern id="tile-band" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="var(--color-tile)" />
          <path d="M8 2 L14 8 L8 14 L2 8 Z" fill="none" stroke="var(--color-paper)" strokeWidth="1.5" />
          <circle cx="8" cy="8" r="1.5" fill="var(--color-paper)" />
        </pattern>
      </defs>
      <rect width="100%" height="16" fill="url(#tile-band)" />
    </svg>
  );
}
