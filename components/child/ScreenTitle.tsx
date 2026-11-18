import type { ReactNode } from "react";

/** Большой заголовок экрана (display 28–40 px, как в нативных приложениях). Едет вместе с содержимым, не липнет. */
export function ScreenTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h1 className={`font-display text-display text-balance ${className}`}>{children}</h1>;
}
