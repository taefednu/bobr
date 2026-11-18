// Язык интерфейса и язык реплик не должны расходиться: иначе ребёнок пишет по-русски, а Ustoz отвечает по-узбекски.
import { describe, expect, it } from "vitest";
import { langSyncStep } from "../lib/i18n";

describe("langSyncStep", () => {
  it("sends the browser choice to the server when they differ", () => {
    expect(langSyncStep("ru", "uz")).toEqual({ to: "server", lang: "ru" });
    expect(langSyncStep("uz", "ru")).toEqual({ to: "server", lang: "uz" });
  });

  it("adopts the child's language on a browser without a choice", () => {
    expect(langSyncStep(null, "ru")).toEqual({ to: "ui", lang: "ru" });
  });

  it("does nothing when they match", () => {
    expect(langSyncStep("ru", "ru")).toBeNull();
  });
});
