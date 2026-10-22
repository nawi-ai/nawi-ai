import { SKILL_PRACTICE, SKILL_STRENGTH, type SkillId } from "@/lib/reading-level";
import { isQuestionResolved, type AttemptSnapshot } from "@/lib/sessions/flow";

export type SkillObservation = "alone" | "helped" | "practicing" | "review";

export type SkillProfileItem = {
  skill: SkillId;
  strength: string;
  practice: string;
  alone: number;
  helped: number;
  practicing: number;
  improving: boolean;
};

export function classifyAttempts(attempts: AttemptSnapshot[]): SkillObservation | null {
  if (!isQuestionResolved(attempts)) return null;
  const correct = attempts.find((attempt) => attempt.isCorrect && !attempt.needsReview);
  if (correct) return correct.attemptNumber === 1 ? "alone" : "helped";
  const latest = attempts[attempts.length - 1];
  if (latest?.needsReview) return "review";
  return "practicing";
}

export function buildSkillProfile(
  entries: Array<{ skill: SkillId; attempts: AttemptSnapshot[] }>,
): SkillProfileItem[] {
  const order: SkillId[] = [];
  const grouped = new Map<SkillId, SkillObservation[]>();

  for (const entry of entries) {
    const observation = classifyAttempts(entry.attempts);
    if (!observation || observation === "review") continue;
    if (!grouped.has(entry.skill)) {
      grouped.set(entry.skill, []);
      order.push(entry.skill);
    }
    grouped.get(entry.skill)?.push(observation);
  }

  return order.map((skill) => {
    const observations = grouped.get(skill) ?? [];
    const earlier = observations.slice(0, -1);
    const latest = observations[observations.length - 1];
    const improving =
      observations.length > 1 &&
      earlier.some((item) => item === "practicing" || item === "helped") &&
      (latest === "alone" || (latest === "helped" && earlier.includes("practicing")));
    return {
      skill,
      strength: SKILL_STRENGTH[skill],
      practice: SKILL_PRACTICE[skill],
      alone: observations.filter((item) => item === "alone").length,
      helped: observations.filter((item) => item === "helped").length,
      practicing: observations.filter((item) => item === "practicing").length,
      improving,
    };
  });
}

export function profileSentence(items: SkillProfileItem[]) {
  const improving = items.find((item) => item.improving);
  if (improving) {
    return `Estás mejorando en ${improving.practice}. Antes necesitabas apoyo y ahora lo logras más seguido.`;
  }
  const strength = items.find((item) => item.alone > 0 && item.practicing === 0);
  const needs = items.find((item) => item.practicing > 0);
  if (strength && needs) {
    return `${strength.strength}. Vamos a practicar ${needs.practice}.`;
  }
  if (needs) return `Vamos a practicar ${needs.practice}.`;
  if (strength) return `${strength.strength}.`;
  const helped = items.find((item) => item.helped > 0);
  if (helped) return `Lo lograste con una pista: ${helped.practice}.`;
  return null;
}
