import { describe, expect, it } from "vitest";

import {
  expectedAttempt,
  isQuestionClosed,
  nextAdaptiveQuestion,
  questionsOnPath,
  type AdaptiveQuestion,
} from "@/lib/sessions/adapt";
import type { AttemptSnapshot } from "@/lib/sessions/flow";

const questions: AdaptiveQuestion[] = [
  { id: "c1", role: "core" },
  { id: "c2", role: "core" },
  { id: "c3", role: "core" },
  { id: "s2", role: "support", supportsQuestionId: "c2" },
  { id: "ch", role: "challenge" },
];

describe("dificultad dentro del cuento", () => {
  it("ofrece un reto después de dos aciertos al primer intento", () => {
    const attempts = [done("c1", true), done("c2", true)];
    expect(nextAdaptiveQuestion(questions, attempts)).toBe("ch");
  });

  it("después del reto vuelve a la pregunta del cuento", () => {
    const attempts = [done("c1", true), done("c2", true), done("ch", true)];
    expect(nextAdaptiveQuestion(questions, attempts)).toBe("c3");
  });

  it("no ofrece el reto si una respuesta necesitó dos intentos", () => {
    const attempts = [done("c1", true), miss("c2", 1), done("c2", true, 2)];
    expect(nextAdaptiveQuestion(questions, attempts)).toBe("c3");
    expect(questionsOnPath(questions, attempts)).not.toContain("ch");
  });

  it("al fallar, abre una pregunta de apoyo y luego devuelve el reto original", () => {
    const missed = [done("c1", true), miss("c2", 1), miss("c2", 2)];
    expect(nextAdaptiveQuestion(questions, missed)).toBe("s2");

    const helped = [...missed, done("s2", true)];
    expect(nextAdaptiveQuestion(questions, helped)).toBe("c2");
    expect(expectedAttempt(questions[1]!, questions, helped)).toBe(3);
    expect(isQuestionClosed(questions[1]!, questions, helped)).toBe(false);

    const recovered = [...helped, done("c2", true, 3)];
    expect(isQuestionClosed(questions[1]!, questions, recovered)).toBe(true);
    expect(nextAdaptiveQuestion(questions, recovered)).toBe("c3");
  });

  it("si la ayuda tampoco sale, sigue el cuento sin repetir el reto", () => {
    const attempts = [done("c1", true), miss("c2", 1), miss("c2", 2), miss("s2", 1), miss("s2", 2)];
    expect(nextAdaptiveQuestion(questions, attempts)).toBe("c3");
    expect(questionsOnPath(questions, attempts)).toEqual(["c1", "c2", "c3", "s2"]);
  });
});

function done(questionId: string, correct: boolean, attemptNumber = 1): AttemptSnapshot {
  return {
    questionId,
    attemptNumber,
    isCorrect: correct,
    needsReview: false,
    nextAction: "continue",
  };
}

function miss(questionId: string, attemptNumber: number): AttemptSnapshot {
  return {
    questionId,
    attemptNumber,
    isCorrect: false,
    needsReview: false,
    nextAction: attemptNumber >= 2 ? "continue" : "retry",
  };
}
