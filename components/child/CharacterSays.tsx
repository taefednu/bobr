import type { ReactNode } from "react";
import { Character, type Who } from "./Character";
import { SpeechBubble } from "./SpeechBubble";

/** Персонаж слева, реплика справа. Телефон: 104 px, десктоп: 144 px (CSS перекрывает размер коробки). */
export function CharacterSays({ who, children }: { who: Who; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Character who={who} size={104} className="sm:!size-36" />
      <SpeechBubble who={who}>{children}</SpeechBubble>
    </div>
  );
}
