import { describe, expect, it } from "vitest";
import { houseLevels, pickNext, pickTeach, planProgress } from "../lib/home/progress";
import { pieVisual } from "../lib/chat/visual";

const order = ["N1", "N2", "N3", "N4", "N5", "N6", "N7", "N8"];
const lv = (m: Record<string, string>) => (t: string) => m[t];

describe("home progress", () => {
  it("next skips done topics and topics that cannot start", () => {
    expect(pickNext(order, lv({ N1: "solved_self" }), (t) => t !== "N2")).toBe("N3");
    expect(pickNext(order, lv({ N1: "taught_bobr" }), () => true)).toBe("N2");
    expect(pickNext(["N1"], lv({ N1: "solved_self" }), () => true)).toBeNull();
    expect(pickNext(order, lv({}), () => false)).toBeNull();
  });
  it("percent is the done share of the plan, rounded", () => {
    expect(planProgress(["a", "b", "c"], lv({ a: "solved_self", b: "taught_bobr" }))).toEqual({ done: 2, total: 3, percent: 67 });
    expect(planProgress([], lv({}))).toEqual({ done: 0, total: 0, percent: 0 });
    expect(planProgress(["a", "b"], lv({ a: "gap" })).percent).toBe(0);
  });
  it("levels: only startable topics, plan order, at most 6, states from level and current", () => {
    const l = houseLevels(order, lv({ N1: "solved_self", N3: "taught_bobr" }), "N2", (t) => t === "N3", (t) => t !== "N4");
    expect(l.map((x) => x.topic)).toEqual(["N1", "N2", "N3", "N5", "N6", "N7"]);
    expect(l.map((x) => x.n)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(l.map((x) => x.state)).toEqual(["done", "current", "review", "next", "next", "next"]);
    expect(l.every((x) => x.canStart)).toBe(true);
  });
});

describe("chat pie visual", () => {
  it("takes the first proper fraction with denominator <= 12, as a string", () => {
    expect(pieVisual("Возьми 3/4 лепёшки")).toEqual({ type: "pie", fraction: "3/4" });
    expect(pieVisual("1/2 + 1/3 = 5/6")).toEqual({ type: "pie", fraction: "1/2" });
  });
  it("no picture for improper, big-denominator, bare or wrong-claim text", () => {
    expect(pieVisual("5/4 это больше целого")).toBeNull();
    expect(pieVisual("1/13 мало")).toBeNull();
    expect(pieVisual("Представь лепёшку")).toBeNull();
    expect(pieVisual("1/2 + 1/3 = 2/5, и ещё 1/4")).toBeNull();
    expect(pieVisual("2024/05")).toBeNull();
  });
});

describe("teach topic", () => {
  const rows = [
    { topic: "N2", level: "solved_self", solvedSelfAt: 30 }, // вне плана (демо)
    { topic: "N5", level: "solved_self", solvedSelfAt: 20 },
    { topic: "N8", level: "solved_self", solvedSelfAt: 10 },
    { topic: "N6", level: "taught_bobr", solvedSelfAt: 40 },
  ];
  it("skips topics outside the plan or not startable, takes the latest valid one", () => {
    expect(pickTeach(rows, ["N8", "N6", "N5"], () => true)).toBe("N5");
    expect(pickTeach(rows, ["N8", "N6", "N5"], (t) => t !== "N5")).toBe("N8");
  });
  it("null when nothing fits, so the circle goes to /house", () => {
    expect(pickTeach(rows, ["N1"], () => true)).toBeNull();
    expect(pickTeach(rows, ["N2"], () => false)).toBeNull();
  });
});
