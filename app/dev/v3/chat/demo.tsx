"use client";
import type { ChatData } from "@/components/chat/model";
import { ChatScreen } from "@/components/v3/chat/ChatScreen";

// Фикстура с эталона: реплики собеседника — данные (русский текст), лепёшка 2/4 приходит как visual.
const T0 = 1_700_000_000_000;
const DATA: ChatData = {
  who: "ustoz",
  pose: null,
  access: { open: true, reason: null, minutesLeft: 20 },
  messages: [
    { id: "1", role: "ustoz", text: "Привет! Давай разберёмся с дробями. Что означает число сверху?", ts: T0 },
    { id: "2", role: "child", text: "Сколько частей взяли", ts: T0 + 1 },
    { id: "3", role: "ustoz", text: "Верно! А число снизу?", ts: T0 + 2 },
    { id: "4", role: "child", text: "Не совсем помню", ts: T0 + 3 },
    { id: "5", role: "ustoz", text: "Ничего страшного. Представь лепёшку: на сколько равных частей её разрезали?", ts: T0 + 4, visual: { type: "pie", fraction: "2/4" } },
  ],
};

export function Demo() {
  return <ChatScreen who="ustoz" data={DATA} optimistic={null} pending={false} notice={null} crisis={false} onSend={() => {}} onLeave={() => {}} onBack={() => {}} />;
}
