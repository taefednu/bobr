// Стопка «числитель / черта / знаменатель» из строки "k/n". Не дробь — просто текст.
export function Fraction({ value, className = "" }: { value: string; className?: string }) {
  const m = /^(\d+|\?)\/(\d+)$/.exec(value); // "?/6": пропуск в числителе у пробы
  if (!m) return <span className={`font-display font-bold tabular ${className}`}>{value}</span>;
  return (
    <span role="img" aria-label={value} className={`inline-flex flex-col items-center font-display font-bold leading-none tabular ${className}`}>
      <span aria-hidden>{m[1]}</span>
      <span aria-hidden className="my-1 block h-[3px] w-full min-w-[1.25em] rounded-full bg-ink" />
      <span aria-hidden>{m[2]}</span>
    </span>
  );
}
