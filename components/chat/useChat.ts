"use client";
// Тонкий слой над api.chat.view и api.chat.send: оптимистичное сообщение, ожидание, исход отправки.
import { useAction, useQuery } from "convex/react";
import { useCallback, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Notice, Partner } from "./model";

type Op = { who: Partner; text: string; base: number };

export function useChat(token: string | null, who: Partner) {
  const data = useQuery(api.chat.view, token ? { token, who } : "skip");
  const send = useAction(api.chat.send);
  const [op, setOp] = useState<Op | null>(null);
  const [outcome, setOutcome] = useState<{ who: Partner; notice: Notice | null; crisis: boolean } | null>(null);
  const busy = useRef(false);
  const count = useRef(0);
  count.current = data?.messages.length ?? 0;

  const submit = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!token || !text || busy.current) return;
      busy.current = true;
      setOutcome(null);
      setOp({ who, text, base: count.current });
      try {
        const { status } = await send({ token, who, text });
        setOutcome({ who, crisis: status === "crisis", notice: status === "fallback" || status === "rejected" ? status : null });
      } catch {
        setOutcome({ who, crisis: false, notice: "error" });
      } finally {
        busy.current = false;
        setOp(null);
      }
    },
    [token, who, send],
  );

  const mine = op?.who === who ? op : null;
  return {
    data,
    pending: !!mine,
    // пока сервер не вернул сообщение ребёнка, показываем его сами
    optimistic: mine && count.current <= mine.base ? mine.text : null,
    notice: outcome?.who === who ? outcome.notice : null,
    crisis: outcome?.crisis ?? false,
    submit,
  };
}
