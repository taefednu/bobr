/** Подставляет {name} из params в шаблон; нет шаблона или ключа — пустая строка. */
export function fill(tpl: string | undefined, params: Record<string, string>) {
  return tpl ? tpl.replace(/\{(\w+)\}/g, (_, k: string) => params[k] ?? "") : "";
}
