// Задача — общий контракт generator → parseAnswer → numberCheck/leakDetector → UI.
// Все дроби и числа — строки ("3/10", "6"); fraction.js только внутри модулей. Текст задачи здесь не
// хранится: его собирает UI из i18n по `kind` и `params`, сюжет мира переписывает LLM (числа — код).
import type { TopicId } from "../types";

/** Три вида задач спеки + MCQ (только диагностика). */
export type TaskKind = "picture" | "word" | "missing" | "mcq";

export type Distractor = {
  value: string;
  /** id заблуждения, если ответ ребёнка = этот дистрактор (например "M9"). */
  misconception?: string;
};

export type Task = {
  id: string;
  topic: TopicId;
  kind: TaskKind;
  seed: number;
  /** Операнды и прочее, что нужно UI для текста и компонента. Только строки. */
  params: Record<string, string>;
  /** Верный ответ, несократимый, строкой. */
  answer: string;
  distractors: Distractor[];
  /** Требовать ли несократимую форму: сократимый верный ввод → `almost`. */
  requireReduced: boolean;
  /** Все числа, которые видит ребёнок в задаче, мультимножеством (для numberCheck). */
  numbersShown: string[];
};
