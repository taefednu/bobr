import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { V3TabBar, type V3Tab } from "./TabBar";

/**
 * Оболочка экрана v3: неподвижный вертикальный градиент на весь вьюпорт, колонка 390 px
 * (шире экран — колонка 430 по центру). `tab` включает таб-бар с этой активной вкладкой; без него бара нет
 * (/house, /chat). Отступы по бокам даёт сама колонка (16 px), поэтому дети кладут блоки в её ширину 358.
 */
export function V3Screen({ tab, children, className }: { tab?: V3Tab; children: ReactNode; className?: string }) {
  return (
    <div className="min-h-dvh" style={{ color: "var(--v3-ink)" }}>
      <div aria-hidden className="fixed inset-0" style={{ background: "var(--v3-bg)" }} />
      <div
        className={cn("relative mx-auto flex min-h-dvh w-full max-w-[var(--v3-col-max)] min-w-0 flex-col px-[var(--v3-gutter)]", className)}
        style={{ paddingBottom: tab ? "calc(var(--v3-nav-h) + var(--v3-nav-gap) + 16px + env(safe-area-inset-bottom))" : "env(safe-area-inset-bottom)" }}
      >
        {children}
      </div>
      {tab && <V3TabBar active={tab} />}
    </div>
  );
}
