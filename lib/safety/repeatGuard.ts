// Устоз повторяет себя? Вердикт; один повтор-ретрай — забота вызывающего.
import { THRESHOLDS } from "../config";
import { trigramJaccard } from "../text/similarity";

export function repeatGuard(reply: string, recent: string[]): { repeat: boolean; score: number } {
  const { jaccardOver, lastLines } = THRESHOLDS.repeatGuard;
  let score = 0;
  for (const line of recent.slice(-lastLines)) score = Math.max(score, trigramJaccard(reply, line));
  return { repeat: score > jaccardOver, score };
}
