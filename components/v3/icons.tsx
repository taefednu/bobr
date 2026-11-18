// Иконки v3: инлайн-SVG, контур currentColor, скруглённые концы. Размер задаёт родитель через size.
import type { SVGProps } from "react";

type P = { size?: number } & Omit<SVGProps<SVGSVGElement>, "width" | "height">;
const base = (size: number, p: Omit<P, "size">) =>
  ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, ...p }) as const;

export const IconHome = ({ size = 26, ...p }: P) => (
  <svg {...base(size, p)}><path d="M3.5 11 12 3.8 20.5 11" /><path d="M5.5 9.5V20h13V9.5" /><path d="M10 20v-5.5h4V20" /></svg>
);
/** Дом с плоской крышей и арочной дверью (вкладка «Мой дом»). */
export const IconHouse = ({ size = 26, ...p }: P) => (
  <svg {...base(size, p)}><path d="M3 9.5h18V20H3z" /><path d="M2.5 9.5 4 5.5h16l1.5 4" /><path d="M9.5 20v-5a2.5 2.5 0 0 1 5 0v5" /></svg>
);
export const IconChat = ({ size = 26, ...p }: P) => (
  <svg {...base(size, p)}><path d="M4 5h16v11H11l-5 4v-4H4z" /></svg>
);
export const IconUser = ({ size = 26, ...p }: P) => (
  <svg {...base(size, p)}><circle cx="12" cy="8" r="3.8" /><path d="M4.5 20.5c.8-4 3.7-6 7.5-6s6.7 2 7.5 6" /></svg>
);
export const IconArrowLeft = ({ size = 24, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={2.6}><path d="M20 12H4M10 5.5 3.5 12 10 18.5" /></svg>
);
export const IconArrowRight = ({ size = 28, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={2.6}><path d="M4 12h16M14 5.5l6.5 6.5-6.5 6.5" /></svg>
);
export const IconChevron = ({ size = 20, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={2.6}><path d="m9 5 7 7-7 7" /></svg>
);
export const IconDots = ({ size = 26, ...p }: P) => (
  <svg {...base(size, p)} fill="currentColor" stroke="none"><circle cx="5" cy="12" r="2.2" /><circle cx="12" cy="12" r="2.2" /><circle cx="19" cy="12" r="2.2" /></svg>
);
export const IconSend = ({ size = 24, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={2.2}><path d="M21 3 10.5 13.5" /><path d="M21 3l-6.5 18-4-7.5L3 9.5z" /></svg>
);
export const IconClose = ({ size = 22, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={2.6}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
