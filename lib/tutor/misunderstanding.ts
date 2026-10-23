import { SKILL_PRACTICE, type SkillId } from "@/lib/reading-level";

export type MisunderstandingKind = "feeling_for_cause" | "too_brief" | "unclear";

const CAUSAL_SKILLS = new Set<SkillId>(["causa", "consecuencias", "pistas", "intenciones", "conexiones"]);

const FEELING =
  /\b(miedo|triste|content[oa]|enojad[oa]|quer[ií]a|sent[ií]a|feliz|asustad[oa]|alegr[eó]|llor)/i;

export function readMisunderstanding(skill: SkillId, answers: string[]) {
  const text = answers.map((answer) => answer.trim()).filter(Boolean).join(" ");
  const words = text.split(/\s+/).filter(Boolean);
  const kind: MisunderstandingKind =
    CAUSAL_SKILLS.has(skill) && FEELING.test(text)
      ? "feeling_for_cause"
      : words.length > 0 && words.length < 4
        ? "too_brief"
        : "unclear";

  return { kind, verdict: verdictFor(skill, kind) };
}

function verdictFor(skill: SkillId, kind: MisunderstandingKind) {
  const practice = SKILL_PRACTICE[skill];
  if (kind === "feeling_for_cause") {
    return "Estás contando lo que alguien siente. Para esta pregunta hay que decir qué cambió o qué lo causó.";
  }
  if (kind === "too_brief") {
    return `La idea quedó muy corta para ${practice}. Puedes decir un poco más, con lo que pasó en el cuento.`;
  }
  return `Todavía no se ve ${practice}. La pista dice en qué parte del cuento mirar.`;
}
