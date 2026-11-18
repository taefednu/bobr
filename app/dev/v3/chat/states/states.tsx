"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { ChatData, ClosedReason, Notice, Partner } from "@/components/chat/model";
import { ChatScreen } from "@/components/v3/chat/ChatScreen";

// Фикстуры только для сверки состояний; тексты реплик — данные, не UI-строки.
const T = 1_700_000_000_000;
const msgs = (who: Partner): ChatData["messages"] => [
  { id: "1", role: who, text: "Привет! Давай разберёмся с дробями. Что означает число сверху?", ts: T },
  { id: "2", role: "child", text: "Сколько частей взяли", ts: T + 1 },
  { id: "3", role: who, text: "Верно! Лепёшку разрезали на 4 части, взяли 3.", ts: T + 2, visual: { type: "pie", fraction: "3/4" } },
  { id: "4", role: "child", text: "Ага, понял", ts: T + 3 },
];
const data = (who: Partner, o: Omit<Partial<ChatData>, "access"> & { access?: Partial<ChatData["access"]> } = {}): ChatData => ({
  who, pose: null, messages: msgs(who), ...o,
  access: { open: true, reason: null, minutesLeft: 30, ...o.access },
});
const closed = (reason: ClosedReason, minutesLeft = 0) => data("ustoz", { access: { open: false, reason, minutesLeft } });
const long = "Я думаю, что число сверху показывает, сколько частей лепёшки мы взяли, а число снизу, на сколько равных частей её разрезали. ".repeat(4).slice(0, 430);

type S = { who?: Partner; data: ChatData | null; optimistic?: string; pending?: boolean; notice?: Notice; crisis?: boolean; draft?: string };
const STATES: Record<string, S> = {
  "empty-ustoz": { data: data("ustoz", { messages: [] }) },
  "empty-bobr": { who: "bobr", data: data("bobr", { messages: [] }) },
  loading: { data: undefined as unknown as null },
  "history-bobr": { who: "bobr", data: data("bobr") },
  waiting: { data: data("ustoz"), optimistic: "А если делить на 3?", pending: true },
  "notice-fallback": { data: data("ustoz"), notice: "fallback" },
  "notice-rejected": { data: data("ustoz"), notice: "rejected" },
  "notice-error": { data: data("ustoz"), notice: "error" },
  "minutes-left": { data: data("ustoz", { access: { minutesLeft: 3 } }) },
  "closed-night": { data: closed("night") },
  "closed-session": { data: closed("session_limit", 25) },
  "closed-day": { data: closed("day_limit") },
  "closed-crisis": { data: closed("crisis_block") },
  crisis: { data: data("ustoz"), crisis: true },
  counter: { data: data("ustoz"), draft: long },
};

export function States() {
  const s = useSearchParams().get("s");
  const [mounted, setMounted] = useState(false); // кризис в живом чате приходит после монтирования; фикстура так же
  useEffect(() => setMounted(true), []);
  const st = s ? STATES[s] : null;
  if (!st) {
    return (
      <div className="flex flex-wrap gap-4 bg-white p-4">
        {Object.keys(STATES).map((k) => (
          <figure key={k} className="m-0"><figcaption className="text-sm">{k}</figcaption><iframe title={k} src={`?s=${k}`} width={390} height={845} className="border" /></figure>
        ))}
      </div>
    );
  }
  return <ChatScreen who={st.who ?? "ustoz"} data={st.data} optimistic={st.optimistic ?? null} pending={!!st.pending} notice={st.notice ?? null} crisis={mounted && !!st.crisis} draft={st.draft} onSend={() => {}} onLeave={() => {}} onBack={() => {}} />;
}
