import type { SkillId } from "@/lib/reading-level";
import type { AttemptSnapshot } from "@/lib/sessions/flow";
import { masteryFromSeeds, sessionObservations, type MasterySeed, type SkillMastery } from "@/lib/tutor/mastery";
import { bandOf } from "@/lib/tutor/policy";

export type TutorContext = {
  skillOf: (questionId: string) => SkillId | undefined;
  bandOf: (skill: SkillId | undefined) => SkillMastery["band"];
};

export function tutorContextFor(
  questions: Array<{ id: string; skill: SkillId }>,
  masteries: SkillMastery[],
): TutorContext {
  const skills = new Map(questions.map((question) => [question.id, question.skill]));
  return {
    skillOf: (questionId) => skills.get(questionId),
    bandOf: (skill) => bandOf(masteries, skill),
  };
}

export function contextFromHistory(
  questions: Array<{ id: string; skill: SkillId }>,
  attempts: AttemptSnapshot[],
  history: MasterySeed[],
) {
  const mastery = masteryFromSeeds([...history, ...sessionObservations(questions, attempts)]);
  return tutorContextFor(questions, mastery);
}
