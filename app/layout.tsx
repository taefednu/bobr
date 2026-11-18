import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/onest";
import "@fontsource-variable/unbounded";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";

export const metadata: Metadata = { title: "Bobr" };

// viewport-fit=cover: контент под вырезом, отступы дают env(safe-area-inset-*). Зум не отключаем.
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#faf2e6" };

// TODO: lang из выбранной локали (uz-Latn | ru), плашка ИИ.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz">
      <body><ConvexClientProvider>{children}</ConvexClientProvider></body>
    </html>
  );
}
