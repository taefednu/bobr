import type { ReactNode } from "react";
import "@fontsource-variable/onest";
import "@fontsource-variable/unbounded";
import "./globals.css";

// TODO: lang из выбранной локали (uz-Latn | ru), ConvexClientProvider, плашка ИИ.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
