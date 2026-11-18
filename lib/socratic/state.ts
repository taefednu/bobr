export type EscalationLevel = 1 | 2 | 3 | 4;
export type InterestTheme = "Nonvoyxona" | "Football" | "Minecraft";
export type Counters = { attemptCount: number; escalationLevel: EscalationLevel };

export function escalate(state: Counters): Counters {
  const attemptCount = state.attemptCount + 1;
  return { attemptCount, escalationLevel: Math.min(4, attemptCount + 1) as EscalationLevel };
}

export const misconceptionTag = (code?: string): string | null => code === "M9" ? "added_denominators" : null;
export const independentResult = (state: Counters): boolean => state.attemptCount === 0 && state.escalationLevel === 1;

/** Only whole, unambiguous phrases become help commands. Other text goes through the guard. */
export function isExplicitHelpRequest(value: string, lang: "uz" | "ru"): boolean {
  const phrase = value.toLowerCase().replace(/[!?,.]/g, " ").replace(/\s+/g, " ").trim();
  return lang === "ru"
    ? /^(?:пожалуйста )?(?:помоги(?: мне)?|подскажи(?: мне)?|дай подсказку|можно подсказку|нужна подсказка|подсказка)(?: пожалуйста)?$/u.test(phrase)
    : /^(?:iltimos )?(?:yordam ber|menga yordam ber|ishora ber|maslahat ber|yordam kerak|ishora kerak)(?: iltimos)?$/u.test(phrase);
}
