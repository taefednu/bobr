"use client";

import Script from "next/script";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useT } from "@/lib/i18n";
import { PressButton } from "@/components/ui/press-button";
import { ParentDashboard, ParentFrame } from "./dashboard";

type TelegramWindow = Window & { Telegram?: { WebApp?: { initData: string; ready: () => void; expand: () => void } } };

function LoginFailure() {
  const { t } = useT();
  return <p role="alert">{t("parent.loginError")}</p>;
}

class DashboardBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <LoginFailure /> : this.props.children; }
}

function ConnectedDashboard({ sessionToken }: { sessionToken: string }) {
  const { t } = useT();
  const data = useQuery(api.parent.dashboard, { sessionToken });
  return data ? <ParentDashboard data={data} /> : <p role="status">{t("parent.loading")}</p>;
}

export default function ParentPage() {
  const { t } = useT();
  const login = useAction(api.parentLogin.parentLogin);
  const [sessionToken, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "outside" | "error">("loading");
  const attempted = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const authenticate = useCallback(async () => {
    if (attempted.current) return;
    const webApp = (window as TelegramWindow).Telegram?.WebApp;
    if (!webApp?.initData) { setStatus("outside"); return; }
    attempted.current = true;
    setStatus("loading");
    webApp.ready(); webApp.expand();
    try {
      const result = await login({ initData: webApp.initData });
      if (mounted.current) setToken(result.sessionToken);
    } catch {
      if (mounted.current) setStatus("error");
      attempted.current = false;
    }
  }, [login]);
  return <ParentFrame>
    <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive"
      onReady={() => { void authenticate(); }} onError={() => setStatus("error")} />
    {sessionToken ? <DashboardBoundary><ConnectedDashboard sessionToken={sessionToken} /></DashboardBoundary> : (
      <section className="space-y-4 rounded-lg border-2 border-ink bg-paper p-6 shadow-rest">
        <h1 className="font-display text-title">{t("parent.title")}</h1>
        <p role={status === "loading" ? "status" : "alert"}>{t(status === "loading" ? "parent.loading" : status === "outside" ? "parent.openFromBot" : "parent.loginError")}</p>
        {status === "error" && <PressButton onClick={() => { void authenticate(); }}>{t("parent.retry")}</PressButton>}
      </section>
    )}
  </ParentFrame>;
}
