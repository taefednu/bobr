// Реестр поз (скилл bobr-mascot): размер PNG и веки для моргания в координатах этого PNG.
export type Who = "bobr" | "ustoz";
export type Pose = "idle";

/** [cx, cy, rx, ry, поворот°]: эллипс поверх нарисованного глаза. */
type Lid = readonly [number, number, number, number, number];

export const POSES: Record<Who, Record<Pose, { w: number; h: number; lids: readonly Lid[] }>> = {
  bobr: { idle: { w: 443, h: 600, lids: [[217, 112, 29, 16, 4], [291, 91, 19, 15, -8]] } },
  ustoz: { idle: { w: 600, h: 555, lids: [[280, 127, 29, 17, 6], [355, 110, 20, 17, -6]] } },
};

/** Веко в цвет меха и перьев вокруг глаза: чистые токены ярче PNG и читаются как очки. */
export const LID_COLOR: Record<Who, string> = {
  bobr: "color-mix(in oklch, var(--color-terracotta) 65%, var(--color-non))",
  ustoz: "color-mix(in oklch, var(--color-tile) 62%, var(--color-garden))",
};

/** Реакция на новую реплику: присел, подпрыгнул, приземлился. scaleX·scaleY ≈ 1, объём держится. */
export const REACTION = {
  scaleY: [1, 0.9, 1.08, 1, 0.92, 1],
  scaleX: [1, 1.1, 0.93, 1, 1.08, 1],
  durationS: 0.5,
} as const;
