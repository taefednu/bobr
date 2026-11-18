"use client";
// Болталка: свободный разговор с Ustoz или Bobr. Токен ребёнка, история у каждого своя (chat:view по who).
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChatView } from "@/components/chat/ChatView";
import type { Partner } from "@/components/chat/model";
import { useChat } from "@/components/chat/useChat";
import { useT } from "@/lib/i18n";
import { useGuard } from "@/lib/ui/session";

export default function Page() {
  const router = useRouter();
  const { t } = useT();
  const { token } = useGuard(4, 4);
  const [who, setWho] = useState<Partner>("ustoz");
  const chat = useChat(token, who);
  return (
    <>
      <h1 className="sr-only">{t("chat.title")}</h1>
      <ChatView
        who={who}
        onWho={setWho}
        data={chat.data}
        optimistic={chat.optimistic}
        pending={chat.pending}
        notice={chat.notice}
        crisis={chat.crisis}
        onSend={chat.submit}
        onLeave={() => router.push("/mahalla")}
      />
    </>
  );
}
