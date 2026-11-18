// Ребёнок «объяснил» переписав реплику Устоза? Тогда это не объяснение (спека, машина состояний).
import { THRESHOLDS } from "../config";
import { trigramJaccard } from "../text/similarity";

export function copyCheck(
  explanation: string,
  ustozLines: string[],
): { copied: boolean; score: number; against?: number } {
  const { jaccardOver, lastUstozLines } = THRESHOLDS.copyCheck;
  const from = Math.max(0, ustozLines.length - lastUstozLines);
  let score = 0;
  let against: number | undefined;
  for (let i = from; i < ustozLines.length; i++) {
    const s = trigramJaccard(explanation, ustozLines[i]);
    if (s > score) {
      score = s;
      against = i;
    }
  }
  return { copied: score > jaccardOver, score, ...(against !== undefined && { against }) };
}
