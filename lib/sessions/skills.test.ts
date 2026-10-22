import { describe, expect, it } from "vitest";

import type { AttemptSnapshot } from "@/lib/sessions/flow";
import { buildSkillProfile, profileSentence } from "@/lib/sessions/skills";

describe("perfil de comprensión", () => {
  it("separa lo que logra solo de lo que todavía practica", () => {
    const items = buildSkillProfile([
      { skill: "personajes", attempts: [mark("q1", 1, true)] },
      { skill: "causa", attempts: [mark("q2", 1, false), mark("q2", 2, false)] },
    ]);
    expect(profileSentence(items)).toBe(
      "Reconoces a los personajes. Vamos a practicar explicar por qué un personaje tomó una decisión.",
    );
  });

  it("nota una mejora cuando la misma habilidad pasa de apoyo a logro", () => {
    const items = buildSkillProfile([
      { skill: "causa", attempts: [mark("q1", 1, false), mark("q1", 2, false)] },
      { skill: "causa", attempts: [mark("q2", 1, true)] },
    ]);
    expect(items[0]?.improving).toBe(true);
    expect(profileSentence(items)).toContain("Estás mejorando");
  });

  it("cuenta como ayuda un acierto después de la pista", () => {
    const items = buildSkillProfile([
      { skill: "emociones", attempts: [mark("q1", 1, false), mark("q1", 2, true)] },
    ]);
    expect(items[0]?.helped).toBe(1);
    expect(items[0]?.alone).toBe(0);
  });
});

function mark(questionId: string, attemptNumber: number, isCorrect: boolean): AttemptSnapshot {
  return {
    questionId,
    attemptNumber,
    isCorrect,
    needsReview: false,
    nextAction: isCorrect || attemptNumber >= 2 ? "continue" : "retry",
  };
}
