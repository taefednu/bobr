// Иконки строк профиля: инлайн-SVG, цвет от родителя (currentColor).
import type { SVGProps } from "react";

const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
type S = SVGProps<SVGSVGElement>;

export const IconGlobe = (s: S) => (<svg {...p} {...s}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.4 3.8 5.4 3.8 9S14.6 18.6 12 21c-2.6-2.4-3.8-5.4-3.8-9S9.4 5.4 12 3Z" /></svg>);
export const IconSound = (s: S) => (<svg {...p} {...s}><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" fill="currentColor" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></svg>);
export const IconTarget = (s: S) => (<svg {...p} {...s}><circle cx="11" cy="13" r="7.5" /><circle cx="11" cy="13" r="3.8" /><path d="m11 13 8-8M16 4.5V8h3.5" /></svg>);
export const IconPeople = (s: S) => (<svg {...p} {...s}><circle cx="9" cy="8" r="3" fill="currentColor" /><circle cx="17" cy="9" r="2.4" fill="currentColor" /><path d="M3.5 19c0-3.2 2.4-5 5.5-5s5.5 1.8 5.5 5ZM15 14.4c3 0 5.5 1.4 5.5 4.6H16" fill="currentColor" /></svg>);
export const IconCheck = (s: S) => (<svg {...p} width={22} height={22} strokeWidth={2.8} {...s}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>);
