import { describe, expect, it } from "vitest";

import { focusSkill, masteryFromSeeds } from "@/lib/tutor/mastery";
import { challengeStreakNeeded, levelSuggestion } from "@/lib/tutor/policy";
import { readMisunderstanding } from "@/lib/tutor/misunderstanding";
import { acceptSocraticQuestion, localRebound } from "@/lib/tutor/socratic";
import { acceptTutorText } from "@/lib/tutor/guard";
import { nextAdaptiveQuestion } from "@/lib/sessions/adapt";
import type { AttemptSnapshot } from "@/lib/sessions/flow";

describe("dominio del lector", () => {
  it("empieza incierto y sube cuando lo logra solo varias veces", () => {
    const first = masteryFromSeeds([{ skill: "causa", observation: "alone" }]);
    expect(first[0]?.band).toBe("unknown");

    const firm = masteryFromSeeds([
      { skill: "causa", observation: "alone" },
      { skill: "causa", observation: "alone" },
      { skill: "causa", observation: "alone" },
      { skill: "causa", observation: "alone" },
    ]);
    expect(firm[0]?.band).toBe("stretch");
    expect(firm[0]?.mastery).toBeGreaterThan(0.74);
  });

  it("marca apoyo cuando la habilidad sigue saliendo mal", () => {
    const weak = masteryFromSeeds([
      { skill: "pistas", observation: "practicing" },
      { skill: "pistas", observation: "practicing" },
      { skill: "pistas", observation: "practicing" },
      { skill: "pistas", observation: "practicing" },
    ]);
    expect(weak[0]?.band).toBe("support");
    expect(focusSkill(weak)).toBe("pistas");
  });

  it("no ofrece un reto si esa habilidad pide apoyo", () => {
    expect(challengeStreakNeeded("support")).toBeNull();
    expect(challengeStreakNeeded("stretch")).toBe(1);
    const questions = [
      { id: "c1", role: "core" as const, skill: "causa" as const },
      { id: "c2", role: "core" as const, skill: "hechos" as const },
      { id: "ch", role: "challenge" as const, skill: "causa" as const },
    ];
    const attempts = [done("c1"), done("c2")];
    expect(
      nextAdaptiveQuestion(questions, attempts, {
        skillOf: (id) => questions.find((question) => question.id === id)?.skill,
        bandOf: () => "support",
      }),
    ).toBeNull();
  });

  it("adelanta el reto cuando la habilidad ya está firme y hay un acierto", () => {
    const questions = [
      { id: "c1", role: "core" as const },
      { id: "c2", role: "core" as const },
      { id: "ch", role: "challenge" as const },
    ];
    expect(
      nextAdaptiveQuestion([questions[0]!, questions[2]!], [done("c1")], {
        skillOf: () => "causa",
        bandOf: () => "stretch",
      }),
    ).toBe("ch");
  });
});

describe("veredicto del malentendido", () => {
  it("distingue un porqué contado como emoción", () => {
    const reading = readMisunderstanding("causa", ["porque tenía miedo"]);
    expect(reading.kind).toBe("feeling_for_cause");
    expect(reading.verdict.toLowerCase()).not.toContain("miedo");
  });

  it("pide un poco más cuando la frase es demasiado corta", () => {
    expect(readMisunderstanding("hechos", ["el gato"]).kind).toBe("too_brief");
  });

  it("no trata la emoción como error cuando la pregunta es de emociones", () => {
    expect(readMisunderstanding("emociones", ["porque tenía miedo"]).kind).not.toBe("feeling_for_cause");
  });

  it("rechaza un veredicto que copia la respuesta", () => {
    expect(acceptTutorText("El agua volvió porque sacaron la rama gruesa del río.", ["sacaron la rama gruesa"])).toBeNull();
    expect(acceptTutorText("Mira qué le tapaba el paso al agua.", ["sacaron la rama gruesa"])).toMatch(/paso/);
  });
});

describe("repregunta", () => {
  it("cita lo que dijo el niño y deja la pista como pregunta", () => {
    const question = localRebound("porque tenía miedo", "¿Qué había en el camino del agua?");
    expect(question).toMatch(/^Dijiste «porque tenía miedo»/);
    expect(question).toMatch(/\?/);
    expect(acceptSocraticQuestion(question ?? "", ["sacaron la rama"], "porque tenía miedo")).toBe(question);
  });

  it("rechaza la repregunta cuando incluye la clave", () => {
    expect(
      acceptSocraticQuestion(
        "Dijiste «miedo». La clave es que sacaron la rama gruesa?",
        ["sacaron la rama gruesa"],
        "miedo",
      ),
    ).toBeNull();
  });
});

describe("sugerencia de nivel", () => {
  it("no mueve el nivel y nombra la habilidad que conviene apoyar", () => {
    const note = levelSuggestion(
      masteryFromSeeds([
        { skill: "causa", observation: "practicing" },
        { skill: "causa", observation: "practicing" },
        { skill: "causa", observation: "practicing" },
        { skill: "causa", observation: "practicing" },
        { skill: "hechos", observation: "alone" },
        { skill: "hechos", observation: "alone" },
        { skill: "hechos", observation: "alone" },
        { skill: "hechos", observation: "alone" },
      ]),
    );
    expect(note).toMatch(/no cambia solo/i);
    expect(note).toMatch(/explicar por qué/i);
  });
});

function done(questionId: string): AttemptSnapshot {
  return {
    questionId,
    attemptNumber: 1,
    isCorrect: true,
    needsReview: false,
    nextAction: "continue",
  };
}
