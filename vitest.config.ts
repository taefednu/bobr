import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // "@/" как в tsconfig: нужен тестам серверного рендера компонентов (tests/lessonScreenLeak.test.ts)
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: { include: ["tests/**/*.test.ts", "lib/**/*.test.ts"], passWithNoTests: true },
});
