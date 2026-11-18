// Internal storage helpers. Reference task data stays on students.currentTask and is never projected wholesale.
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Task } from "../lib/fractions/task";
import Fraction from "fraction.js";

export type StoredTask = Omit<Task, "seed">;

/** Exact, private worked reference. Never used as a public hint or model input. */
export function buildReferenceSteps(task: Pick<StoredTask, "params" | "answer">): string[] {
  const p = task.params;
  const steps: string[] = [];
  if (p.a && p.c && (p.den || (p.b && p.d))) {
    const leftDen = BigInt(p.den ?? p.b);
    const rightDen = BigInt(p.den ?? p.d);
    const left = new Fraction(BigInt(p.a), leftDen);
    const right = new Fraction(BigInt(p.c), rightDen);
    const gcd = (a: bigint, b: bigint): bigint => b === 0n ? a : gcd(b, a % b);
    const denominator = p.toDen ? BigInt(p.toDen) : leftDen / gcd(leftDen, rightDen) * rightDen;
    steps.push(`common_denominator:${denominator}`);
    steps.push(`left:${left.n * (denominator / left.d)}/${denominator}`);
    steps.push(`right:${right.n * (denominator / right.d)}/${denominator}`);
    steps.push(`sum:${left.add(right).toFraction()}`);
  } else if (p.num && p.den) {
    steps.push(`fraction:${new Fraction(`${p.num}/${p.den}`).toFraction()}`);
    if (p.toDen) steps.push(`equivalent_numerator:${new Fraction(p.num).mul(p.toDen).div(p.den).toFraction()}`);
  } else if (p.a && p.b) steps.push(`least_common_multiple:${task.answer}`);
  steps.push(`answer:${task.answer}`);
  return steps;
}
export async function attachTask(ctx: MutationCtx, studentId: Id<"students">, lessonSessionId: Id<"lessonSessions">, task: StoredTask, now: number) {
  const taskInstanceId = await ctx.db.insert("taskProgress", {
    studentId, lessonSessionId, topicNodeId: task.topic, taskId: task.id,
    attemptCount: 0, escalationLevel: 1, misconceptionTag: null, outcome: "active", createdAt: now,
  });
  await ctx.db.patch("students", studentId, { lessonSessionId, taskInstanceId, currentTask: { ...task, referenceSteps: buildReferenceSteps(task) } });
  return taskInstanceId;
}

export async function beginLesson(ctx: MutationCtx, studentId: Id<"students">, task: StoredTask, now: number) {
  const student = await ctx.db.get("students", studentId);
  if (student?.lessonSessionId) {
    const old = await ctx.db.get("lessonSessions", student.lessonSessionId);
    if (old?.status === "active") await ctx.db.patch("lessonSessions", old._id, { status: "completed", endedAt: now });
  }
  const lessonSessionId = await ctx.db.insert("lessonSessions", { studentId, topicNodeId: task.topic, status: "active", startedAt: now });
  await attachTask(ctx, studentId, lessonSessionId, task, now);
  return lessonSessionId;
}

export async function progressOf(ctx: QueryCtx, student: Doc<"students">) {
  const progress = student.taskInstanceId && await ctx.db.get("taskProgress", student.taskInstanceId);
  return progress && progress.studentId === student._id && progress.lessonSessionId === student.lessonSessionId ? progress : null;
}

export function publicProgress(progress: Doc<"taskProgress"> | null, student: Doc<"students">) {
  return progress ? {
    taskInstanceId: progress._id, lessonSessionId: progress.lessonSessionId,
    attemptCount: progress.attemptCount, escalationLevel: progress.escalationLevel,
    misconceptionTag: progress.misconceptionTag, interestTheme: student.interestTheme ?? "Nonvoyxona" as const,
  } : null;
}
