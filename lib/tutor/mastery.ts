import type { SkillId } from "@/lib/reading-level";
import { classifyAttempts, type SkillObservation } from "@/lib/sessions/skills";
import type { AttemptSnapshot } from "@/lib/sessions/flow";

export type MasteryBand = "unknown" | "support" | "steady" | "stretch";

export type MasterySeed = {
  skill: SkillId;
  observation: Exclude<SkillObservation, "review">;
};

export type SkillMastery = {
  skill: SkillId;
  mastery: number;
  evidence: number;
  alone: number;
  helped: number;
  practicing: number;
  band: MasteryBand;
};

const PRIOR_YES = 2;
const PRIOR_NO = 2;

export function masteryFromSeeds(seeds: MasterySeed[]): SkillMastery[] {
  const grouped = new Map<SkillId, MasterySeed[]>();
  for (const seed of seeds) {
    const list = grouped.get(seed.skill) ?? [];
    list.push(seed);
    grouped.set(seed.skill, list);
  }

  return [...grouped.entries()].map(([skill, observations]) => {
    let yes = PRIOR_YES;
    let no = PRIOR_NO;
    let alone = 0;
    let helped = 0;
    let practicing = 0;
    for (const observation of observations) {
      if (observation.observation === "alone") {
        yes += 1;
        alone += 1;
      } else if (observation.observation === "helped") {
        yes += 0.5;
        helped += 1;
      } else {
        no += 1;
        practicing += 1;
      }
    }
    const mastery = yes / (yes + no);
    const evidence = observations.length;
    return { skill, mastery, evidence, alone, helped, practicing, band: bandFor(mastery, evidence) };
  });
}

export function sessionObservations(
  questions: Array<{ id: string; skill: SkillId }>,
  attempts: AttemptSnapshot[],
): MasterySeed[] {
  return questions.flatMap((question) => {
    const group = attempts.filter((attempt) => attempt.questionId === question.id);
    const observation = classifyAttempts(group);
    if (!observation || observation === "review") return [];
    return [{ skill: question.skill, observation }];
  });
}

export function focusSkill(masteries: SkillMastery[]): SkillId | null {
  const weak = masteries
    .filter((item) => item.band === "support")
    .sort((a, b) => a.mastery - b.mastery);
  return weak[0]?.skill ?? null;
}

function bandFor(mastery: number, evidence: number): MasteryBand {
  if (evidence < 2) return "unknown";
  if (mastery < 0.45) return "support";
  if (mastery >= 0.75 && evidence >= 3) return "stretch";
  return "steady";
}
