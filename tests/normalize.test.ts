import { describe, expect, it } from "vitest";
import { normalizeForMatch, normalizeText } from "../lib/text/normalize";

describe("normalizeText", () => {
  it("½ и смешанное «1½» → «1/2» и «1 1/2», а не 11/2", () => {
    expect(normalizeText("½")).toBe("1/2");
    expect(normalizeText("1½")).toBe("1 1/2");
    expect(normalizeText("2¾")).toBe("2 3/4");
    expect(normalizeText("1⁄3")).toBe("1/3"); // U+2044
  });

  it("невидимые символы и пробелы", () => {
    expect(normalizeText(" 2​/‍5 ")).toBe("2/5");
    expect(normalizeText("1   / 2")).toBe("1 / 2");
  });

  it("апострофы узбекского приводятся к одному виду (разные байты на входе)", () => {
    const forms = ["oʻ", "o'", "o’", "o‘", "o`", "oʼ"];
    expect(new Set(forms).size).toBe(forms.length); // входы действительно разные
    for (const f of forms) expect(normalizeText(f)).toBe("o'");
  });

  it("полноширинные цифры и дефисы (NFKC)", () => {
    expect(normalizeText("３／４")).toBe("3/4");
    expect(normalizeText("a–b−c")).toBe("a-b-c");
  });

  it("normalizeForMatch: регистр и ё", () => {
    expect(normalizeForMatch("Две ТРЕТИ, ЁЖ")).toBe("две трети, еж");
  });
});
