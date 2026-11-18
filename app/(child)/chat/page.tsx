"use client";
// Болталка: свободный разговор с Ustoz или Bobr. Токен ребёнка, история у каждого своя (chat:view по who).
// Партнёр берётся из ?who=ustoz|bobr (по умолчанию ustoz); useSearchParams требует Suspense при пререндере.
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { Suspense } from "react";
import { api } from "@/convex/_generated/api";
import type { Partner } from "@/components/chat/model";
import { useChat } from "@/components/chat/useChat";
import { ChatScreen } from "@/components/v3/chat/ChatScreen";
import { useGuard } from "@/lib/ui/session";

function Chat() {
  const router = useRouter();
  const who: Partner = useSearchParams().get("who") === "bobr" ? "bobr" : "ustoz";
  const { token } = useGuard(4, 4);
  const chat = useChat(token, who);
  const leaveCrisis = useMutation(api.conductor.leaveCrisis);
  // выход из кризиса снимает CRISIS-стейт (иначе уроки заперты); вне кризиса мутация ничего не меняет
  const leave = async () => {
    if (token) await leaveCrisis({ token }).catch(() => {});
    router.push("/home");
  };
  return (
    <ChatScreen
      who={who}
      data={chat.data}
      optimistic={chat.optimistic}
      pending={chat.pending}
      notice={chat.notice}
      crisis={chat.crisis}
      onSend={chat.submit}
      onLeave={leave}
      onBack={() => router.push("/home")}
    />
  );
}

export default function Page() {
  return (
    <Suspense>
      <Chat />
    </Suspense>
  );
}
