/** Ограждение данных в хвосте промпта. Внутри ни один `<` / `>` не остаётся: оба заменяются на
 *  полноширинные ‹ › (U+2039/U+203A), так что никакой тег — с невидимыми символами, пробелами,
 *  другим регистром — не может закрыть ограждение. Для смысла детского текста угловые скобки не важны. */
export function fence(tag: string, text: string): string {
  const safe = text.normalize("NFKC").replace(/</g, "‹").replace(/>/g, "›");
  return `<${tag}>${safe}</${tag}>`;
}

export const fenceChildInput = (text: string): string => fence("child_input", text);
