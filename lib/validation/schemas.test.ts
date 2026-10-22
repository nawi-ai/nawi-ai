import { describe, expect, it } from "vitest";

import {
  createSessionSchema,
  evaluateRequestSchema,
  evaluationResponseSchema,
} from "@/lib/validation/schemas";

describe("validación", () => {
  it("acepta la nueva oportunidad y rechaza un cuarto intento", () => {
    expect(
      evaluateRequestSchema.safeParse({
        questionId: "tomi-q2",
        answer: "tomi-q2-c",
        attemptNumber: 3,
      }).success,
    ).toBe(true);
    expect(
      evaluateRequestSchema.safeParse({
        questionId: "tomi-q2",
        answer: "tomi-q2-c",
        attemptNumber: 4,
      }).success,
    ).toBe(false);
  });

  it("rechaza un puntaje o acierto enviado por el cliente", () => {
    const parsed = evaluateRequestSchema.safeParse({
      questionId: "luna-q1",
      answer: "en el jardín",
      attemptNumber: 1,
      is_correct: true,
      score: 100,
    });
    expect(parsed.success).toBe(false);
  });

  it("rechaza el identificador de otro lector al crear la sesión", () => {
    const parsed = createSessionSchema.safeParse({
      storyId: "luna-jardin-estrellas",
      readingLevel: 1,
      readerId: "11111111-1111-4111-8111-111111111111",
    });
    expect(parsed.success).toBe(false);
  });

  it("acepta una evaluación estructurada y rechaza confianza imposible", () => {
    expect(
      evaluationResponseSchema.safeParse({
        is_correct: true,
        confidence: 0.92,
        feedback: "Encontraste la pista.",
        hint: null,
        next_action: "continue",
      }).success,
    ).toBe(true);
    expect(
      evaluationResponseSchema.safeParse({
        is_correct: true,
        confidence: 1.4,
        feedback: "Sí",
        hint: null,
        next_action: "inventada",
      }).success,
    ).toBe(false);
  });
});
