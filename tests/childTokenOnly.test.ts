// B9: детские функции берут ребёнка только по токену; studentId с клиента не принимается ни в args, ни в ответе me.
import { describe, expect, it } from "vitest";
import { view } from "../convex/lesson";
import { leaveCrisis, startDemoLesson } from "../convex/conductor";
import { turn } from "../convex/turn";
import { explain, start } from "../convex/teach";
import { me, whoArgs } from "../convex/session";

const exported = (f: unknown) => (f as { exportArgs: () => string }).exportArgs();
const returns = (f: unknown) => (f as { exportReturns: () => string }).exportReturns();

describe("детский вход: только токен", () => {
  it("args не содержат studentId, token обязателен", () => {
    for (const f of [view, leaveCrisis, turn, start, explain, me]) {
      expect(exported(f)).not.toContain("studentId");
      expect(exported(f)).toContain("token");
    }
    expect(Object.keys(whoArgs)).toEqual(["token"]);
    expect(whoArgs.token.isOptional).toBe("required");
  });
  it("session:me не отдаёт studentId; startDemoLesson отдаёт token", () => {
    expect(returns(me)).not.toContain("studentId");
    expect(returns(startDemoLesson)).toContain("token");
  });
});
