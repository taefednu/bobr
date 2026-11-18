import type { ReactNode } from "react";
import { Character, type Who } from "./Character";
import { SpeechBubble } from "./SpeechBubble";

/** Персонаж слева, реплика справа. Телефон: 88 px, десктоп: 128 px (CSS перекрывает width/height). */
export function CharacterSays({ who, children }: { who: Who; children: ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <Character who={who} size={88} className="sm:size-32" />
      <SpeechBubble who={who}>{children}</SpeechBubble>
    </div>
  );
}
