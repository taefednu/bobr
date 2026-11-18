// numberCheck: мультимножество чисел-цифр в реплике LLM должно РАВНЯТЬСЯ numbersShown (строго).
// Дробь «3/10» даёт два числа 3 и 10; десятичное «0,5»/«0.5» — одно число "0.5". Слова-числа не считаются:
// worldRewrite обязан писать числа только цифрами. Лишнее/пропавшее число — реплика отклоняется.
// Ослабленный режим для реплик Ustoz — решение этапа 2, здесь его нет.
import { normalizeText } from "../text/normalize";

const NUMBER = /\d+(?:[.,]\d+)?/g;

function tokens(s: string): string[] {
  return (normalizeText(s).match(NUMBER) ?? []).map((t) => t.replace(",", "."));
}

function count(xs: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
  return m;
}

/** extra — числа, которых в numbersShown нет (или больше раз); missing — наоборот. Для логов. */
export function numberCheck(
  text: string,
  numbersShown: string[],
): { ok: boolean; extra: string[]; missing: string[] } {
  const inText = tokens(text);
  const shown = numbersShown.flatMap(tokens);
  const diff = (a: string[], b: string[]) => {
    const left = count(b);
    return a.filter((x) => {
      const n = left.get(x) ?? 0;
      if (n > 0) left.set(x, n - 1);
      return n === 0;
    });
  };
  const extra = diff(inText, shown);
  const missing = diff(shown, inText);
  return { ok: extra.length === 0 && missing.length === 0, extra, missing };
}
