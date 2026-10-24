import { SKILL_PRACTICE, type SkillId } from "@/lib/reading-level";
import type { SkillMastery } from "@/lib/tutor/mastery";

export function levelSuggestion(masteries: SkillMastery[]) {
  const known = masteries.filter((item) => item.evidence >= 4);
  if (known.length < 2) return null;
  const weak = known.filter((item) => item.band === "support").sort((a, b) => a.mastery - b.mastery);
  if (weak[0]) {
    return `Tu nivel no cambia solo. Conviene seguir apoyando ${SKILL_PRACTICE[weak[0].skill]}.`;
  }
  const stretch = known.filter((item) => item.band === "stretch");
  if (stretch.length >= 2) {
    return "Tu nivel no cambia solo. Si quieres, en los caminos puedes probar el siguiente: estas habilidades ya están firmes.";
  }
  return null;
}

export function challengeStreakNeeded(band: SkillMastery["band"] | "unknown") {
  if (band === "support") return null;
  if (band === "stretch") return 1;
  return 2;
}

export function bandOf(masteries: SkillMastery[], skill: SkillId | undefined) {
  if (!skill) return "unknown" as const;
  return masteries.find((item) => item.skill === skill)?.band ?? "unknown";
}
