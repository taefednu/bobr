import { describe, expect, it } from "vitest";
import { houseLevels, houseTopics, pickNext, sessionStartPatch, pickTeach, planProgress } from "../lib/home/progress";
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
  it("levels: current is the first topic not done, done and review stay open, canStart everywhere", () => {
    const l = houseLevels(["N8", "N6", "N5", "N9", "N2", "N3"], lv({ N8: "solved_self", N6: "taught_bobr" }), (t) => t === "N6");
    expect(l.map((x) => x.n)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(l.map((x) => x.state)).toEqual(["done", "review", "current", "next", "next", "next"]);
    expect(l.every((x) => x.canStart)).toBe(true);
  });
  it("level done moves current to the next stone", () => {
    const t = ["N8", "N6", "N5"];
    expect(houseLevels(t, lv({}), () => false).map((x) => x.state)).toEqual(["current", "next", "next"]);
    expect(houseLevels(t, lv({ N8: "solved_self" }), () => false).map((x) => x.state)).toEqual(["done", "current", "next"]);
  });
});

const G = [
  { id: "N1", prereqs: [] }, { id: "N2", prereqs: ["N1"] }, { id: "N3", prereqs: ["N2"] }, { id: "N4", prereqs: ["N3"] },
  { id: "N5", prereqs: ["N4", "N6"] }, { id: "N6", prereqs: [] }, { id: "N8", prereqs: ["N2"] }, { id: "N9", prereqs: ["N5", "N8"] },
];
describe("session start", () => {
  it("keeps the streak of an unfinished session, resets it for a fresh or finished one", () => {
    expect(sessionStartPatch({ tasksThisSession: 3 }, 8)).toEqual({ tasksThisSession: 1 });
    expect(sessionStartPatch({ tasksThisSession: 0 }, 8)).toEqual({ tasksThisSession: 1, streak: 0 });
    expect(sessionStartPatch({ tasksThisSession: 8 }, 8)).toEqual({ tasksThisSession: 1, streak: 0 });
  });
});

describe("house topics", () => {
  const ok = (t: string) => t !== "N1";
  it("plan first in plan order, then the rest of the graph in prerequisite order, six in all", () => {
    expect(houseTopics(["N8", "N6", "N5", "N9"], G, ok)).toEqual(["N8", "N6", "N5", "N9", "N2", "N3"]);
    expect(houseTopics(["N6"], G, ok)).toEqual(["N6", "N2", "N3", "N4", "N5", "N8"]);
  });
  it("topics that cannot start are skipped, even in the plan; empty plan falls back to the graph", () => {
    expect(houseTopics(["N1", "N8"], G, ok)[0]).toBe("N8");
    expect(houseTopics([], G, ok)).toEqual(["N2", "N3", "N4", "N6", "N5", "N8"]);
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
  it("works without a plan: teaches a topic the house shows, not one outside its six", () => {
    const g = [{ id: "N2", prereqs: [] }, { id: "N5", prereqs: ["N2"] }, { id: "N9", prereqs: ["N5"] }];
    const shown = houseTopics([], g, () => true);
    expect(pickTeach(rows, shown, () => true)).toBe("N2");
    expect(pickTeach([{ topic: "N7", level: "solved_self", solvedSelfAt: 99 }, ...rows], shown, (t) => t !== "N7")).toBe("N2");
  });
  it("null when nothing fits, so the circle goes to /house", () => {
    expect(pickTeach(rows, ["N1"], () => true)).toBeNull();
    expect(pickTeach(rows, ["N2"], () => false)).toBeNull();
  });
});
