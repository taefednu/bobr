import type { TopicId } from "../types";

export type ChecklistIdea = { id: string; about: string }; // about — по-русски, для промптов судьи и Bobr
export type Checklist = { topic: TopicId; ideas: ChecklistIdea[] }; // все идеи обязательны, порядок значим

// TODO(B1): заменить на content/checklists
const CHECKLISTS: Partial<Record<TopicId, ChecklistIdea[]>> = {
  N2: [
    { id: "N2.1", about: "знаменатель показывает, на сколько равных частей разделили целое" },
    { id: "N2.2", about: "числитель показывает, сколько таких частей взяли" },
  ],
  N5: [
    { id: "N5.1", about: "чтобы получить равную дробь, числитель и знаменатель умножают на одно и то же число" },
    { id: "N5.2", about: "значение дроби при этом не меняется, меняется только размер частей" },
  ],
  N6: [
    { id: "N6.1", about: "общее кратное делится на оба числа без остатка" },
    { id: "N6.2", about: "нужно наименьшее такое число, а не любое" },
  ],
  N8: [
    { id: "N8.1", about: "знаменатель остаётся тем же: это доли того же размера" },
    { id: "N8.2", about: "числители складываем" },
  ],
  N9: [
    { id: "N9.1", about: "приводим дроби к общему знаменателю" },
    { id: "N9.2", about: "переписываем дроби с равным значением" },
    { id: "N9.3", about: "складываем числители" },
  ],
};

export function checklistFor(topic: TopicId): Checklist | null {
  const ideas = CHECKLISTS[topic];
  return ideas ? { topic, ideas } : null;
}
