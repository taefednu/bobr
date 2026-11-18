import type { ReactNode } from "react";
import "@fontsource-variable/onest";
import "@fontsource-variable/unbounded";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";

// TODO: lang из выбранной локали (uz-Latn | ru), плашка ИИ.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz">
      <body><ConvexClientProvider>{children}</ConvexClientProvider></body>
    </html>
  );
}
