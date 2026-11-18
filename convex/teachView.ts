// Публичная проекция сцены «Научи Bobr» для useQuery: БЕЗ answer. Попытка считается из (тема, beat, turnNo), в БД её нет.
// Чистые функции: тестируются в tests/teachScene.test.ts. Импорты lib/ — только относительные.
import { sceneAttempt } from "../lib/bobr/attempts";
import { BEAT_POSE, type Beat } from "../lib/bobr/scene";
import { normalizeComponent, toStored } from "../lib/llm";
import type { TopicId } from "../lib/types";
import type { Doc } from "./_generated/dataModel";
import { operandFractions, publicTask } from "./lessonView";

export type Scene = NonNullable<Doc<"students">["teachScene"]>;

/** Сцена по умолчанию после вердикта: реплика модели дописывается recordBobrLine. */
export function defaultScene(beat: Beat, turnNo: number, lineKey: string | null = `teach.line.${beat}`): Scene {
  return { turnNo, beat, reply: null, lineKey, pose: BEAT_POSE[beat] };
}

export function teachSceneView(s: Doc<"students">, rounds: number, bobrLevel: number) {
  const sc = s.teachScene;
  const att = sc && s.currentTopic ? sceneAttempt(s.currentTopic as TopicId, sc) : null;
  if (!sc || !att) return null;
  const { kind, params, numbersShown } = publicTask(att.task);
  return {
    state: s.state, turnNo: sc.turnNo, beat: sc.beat, reply: sc.reply, lineKey: sc.lineKey, pose: sc.pose,
    attempt: att.attempt, expression: att.expression, task: { kind, params, numbersShown }, rounds, bobrLevel,
    demo: sc.beat === "give_up"
      ? toStored(normalizeComponent(null, { operands: operandFractions(att.task.params), childFractions: [], answer: att.task.answer }).component)
      : null,
  };
}
