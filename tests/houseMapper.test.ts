import { describe, expect, it } from "vitest";
import { demote, houseState } from "../lib/houses/houseMapper";

const D = 86_400_000;
const now = 100 * D;

describe("houseState", () => {
  it("maps levels", () => {
    expect(houseState(undefined, now)).toBe("empty");
    expect(houseState({}, now)).toBe("empty");
    expect(houseState({ level: "gap" }, now)).toBe("scaffold");
    expect(houseState({ level: "solved_self" }, now)).toBe("built");
  });
  it("taught_bobr: alive under 7 days, dimmed at exactly 7 and after", () => {
    expect(houseState({ level: "taught_bobr", taughtAt: now - 7 * D + 1 }, now)).toBe("alive");
    expect(houseState({ level: "taught_bobr", taughtAt: now - 7 * D }, now)).toBe("dimmed");
    expect(houseState({ level: "taught_bobr", taughtAt: now - 30 * D }, now)).toBe("dimmed");
  });
});

describe("demote", () => {
  it("taught→solved_self→gap, gap stays", () => {
    expect(demote("taught_bobr")).toBe("solved_self");
    expect(demote("solved_self")).toBe("gap");
    expect(demote("gap")).toBe("gap");
  });
});
