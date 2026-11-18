import type { ReactNode } from "react";
import { ScreenTitle } from "./ScreenTitle";

/**
 * Экран в две колонки от lg (D1): слева заголовок и `aside` (обычно CharacterSays), липнут при прокрутке;
 * справа действия и карточки. До lg одна колонка: заголовок, aside, содержимое.
 * Ширину даёт ChildShell (main на lg до 72 rem), поэтому никаких вынесений за колонку и transform.
 */
export function SplitScreen({ title, aside, children }: { title: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-10">
      <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-[calc(var(--top-bar-h)+1.5rem)]">
        <ScreenTitle>{title}</ScreenTitle>
        {aside}
      </div>
      <div className="flex min-w-0 flex-col gap-6">{children}</div>
    </div>
  );
}
