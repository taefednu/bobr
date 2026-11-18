import { describe, expect, it } from "vitest";
import { resolveDemoMode } from "../lib/config";

describe("resolveDemoMode", () => {
  it("default: live with key, replay without", () => {
    expect(resolveDemoMode(undefined, true)).toBe("live");
    expect(resolveDemoMode(undefined, false)).toBe("replay");
  });
  it("replay is forceable with a key; live without a key is impossible", () => {
    expect(resolveDemoMode("replay", true)).toBe("replay");
    expect(resolveDemoMode("live", false)).toBe("replay");
    expect(resolveDemoMode("garbage", true)).toBe("live");
  });
});
