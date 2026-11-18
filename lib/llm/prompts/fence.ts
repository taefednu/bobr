/** Ограждение данных в хвосте промпта. Закрывающий тег внутри текста обезвреживается, чтобы ввод не мог «выйти» из тега. */
export function fence(tag: string, text: string): string {
  const safe = text.normalize("NFKC").replace(new RegExp(`<\\s*/?\\s*${tag}[^>]*>?`, "gi"), "[tag]");
  return `<${tag}>${safe}</${tag}>`;
}

export const fenceChildInput = (text: string): string => fence("child_input", text);
