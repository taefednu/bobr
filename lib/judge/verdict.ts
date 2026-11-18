import type { Judge } from "../types";
import { fence } from "../llm/prompts/fence";
import { normalizeForMatch } from "../text/normalize";
import type { Checklist, ChecklistIdea } from "./checklists";

export type JudgeDecision = {
  verdict: "pass" | "partial" | "fail";
  copied: boolean; // модель сказала copiedFromUstoz
  foundIds: string[]; // идеи с проверенной цитатой, в порядке чек-листа
  missingIdea: ChecklistIdea | null; // первая непроверенная; при partial со всеми найденными — последняя идея; при pass/fail-без-пробела null
};

/** Ровно то, что судья видит внутри fence(): текст без тегов-ограждения. */
export function seenByJudge(explanation: string): string {
  const f = fence("x", explanation);
  return f.slice("<x>".length, f.length - "</x>".length);
}

const MIN_QUOTE = 3;
const FENCE_TAG = /‹\/?[a-z_]+›/; // тег из текста ребёнка — попытка инъекции, а не объяснение

export function decideJudge(out: Judge, c: { checklist: Checklist; explanation: string }): JudgeDecision {
  const seen = normalizeForMatch(seenByJudge(c.explanation));
  const verified = new Set<string>();
  const used = new Set<string>(); // одна цитата — одна идея: первая подходящая в порядке ответа модели
  for (const i of out.ideas) {
    const q = normalizeForMatch(seenByJudge(i.quote)); // модель может вернуть и `<`, и `‹` из ограждения
    if (i.found && q.length >= MIN_QUOTE && !FENCE_TAG.test(q) && seen.includes(q) && !used.has(q)) {
      verified.add(i.id);
      used.add(q);
    }
  }
  const foundIds = c.checklist.ideas.filter((i) => verified.has(i.id)).map((i) => i.id);
  const firstMissing = c.checklist.ideas.find((i) => !verified.has(i.id)) ?? null;
  const verdict =
    out.falseClaims.length > 0 || out.verdict === "fail"
      ? "fail"
      : !firstMissing && out.verdict === "pass" && !out.copiedFromUstoz
        ? "pass"
        : "partial";
  // partial при всех идеях (модель не дала pass или copied): вопросу Bobr нужен предмет — последняя идея
  const missingIdea = firstMissing ?? (verdict === "partial" ? (c.checklist.ideas.at(-1) ?? null) : null);
  return { verdict, copied: out.copiedFromUstoz, foundIds, missingIdea };
}

export function judgeUnavailable(checklist: Checklist): JudgeDecision {
  return { verdict: "partial", copied: false, foundIds: [], missingIdea: checklist.ideas[0] ?? null };
}
