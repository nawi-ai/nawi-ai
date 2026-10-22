import { describe, expect, it } from "vitest";

import { applyPedagogy, isQuestionResolved, scoreSession } from "@/lib/sessions/flow";

const questions = ["q1", "q2", "q3"];

describe("puntaje", () => {
  it("calcula aciertos sobre preguntas evaluadas", () => {
    const scored = scoreSession(questions, [
      attempt("q1", 1, true),
      attempt("q2", 1, false, { nextAction: "retry" }),
      attempt("q2", 2, true),
      attempt("q3", 1, false, { nextAction: "retry" }),
      attempt("q3", 2, false),
    ]);
    expect(scored.complete).toBe(true);
    expect(scored.result.correct).toBe(2);
    expect(scored.result.evaluated).toBe(3);
    expect(scored.result.score).toBe(67);
  });

  it("no cuenta una revisión pendiente como error", () => {
    const scored = scoreSession(questions, [
      attempt("q1", 1, true),
      attempt("q2", 1, true),
      attempt("q3", 1, false, { needsReview: true, nextAction: "clarify" }),
      attempt("q3", 2, false, { needsReview: true }),
    ]);
    expect(scored.complete).toBe(true);
    expect(scored.result.correct).toBe(2);
    expect(scored.result.pendingReview).toBe(1);
    expect(scored.result.evaluated).toBe(2);
    expect(scored.result.score).toBe(100);
  });

  it("no marca como incorrecta una pregunta sin cerrar", () => {
    const scored = scoreSession(questions, [attempt("q1", 1, true)]);
    expect(scored.complete).toBe(false);
    expect(scored.result.incorrect).toBe(0);
  });

  it("deja el puntaje vacío si no hay nada evaluado", () => {
    const scored = scoreSession(["q1"], [
      attempt("q1", 2, false, { needsReview: true }),
    ]);
    expect(scored.result.score).toBeNull();
  });
});

describe("pedagogía", () => {
  it("no acepta un acierto con poca confianza", () => {
    const result = applyPedagogy(
      {
        isCorrect: true,
        confidence: 0.4,
        feedback: "Sí",
        hint: null,
        nextAction: "continue",
      },
      1,
      { first: "Busca en el cuento", second: "Mira el final" },
      true,
    );
    expect(result.isCorrect).toBe(false);
    expect(result.needsReview).toBe(true);
    expect(result.nextAction).toBe("clarify");
    expect(isQuestionResolved([snapshot(result, 1)])).toBe(false);
  });

  it("permite continuar en el segundo error sin revelar el acierto", () => {
    const result = applyPedagogy(
      {
        isCorrect: false,
        confidence: 0.9,
        feedback: "La pista está en el jardín.",
        hint: "Vuelve al inicio",
        nextAction: "continue",
      },
      1,
      { first: "Pista local", second: "Pista concreta" },
      true,
    );
    expect(result.nextAction).toBe("retry");
    expect(result.isCorrect).toBe(false);
  });
});

function attempt(
  questionId: string,
  attemptNumber: number,
  isCorrect: boolean,
  extra?: { needsReview?: boolean; nextAction?: "continue" | "retry" | "clarify" },
) {
  return {
    questionId,
    attemptNumber,
    isCorrect,
    needsReview: extra?.needsReview ?? false,
    nextAction: extra?.nextAction ?? (isCorrect || attemptNumber >= 2 ? "continue" : "retry"),
  } as const;
}

function snapshot(
  result: { isCorrect: boolean; needsReview: boolean; nextAction: "continue" | "retry" | "clarify" },
  attemptNumber: number,
) {
  return {
    questionId: "q1",
    attemptNumber,
    isCorrect: result.isCorrect,
    needsReview: result.needsReview,
    nextAction: result.nextAction,
  };
}
