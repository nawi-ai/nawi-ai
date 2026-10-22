import { describe, expect, it } from "vitest";

import {
  evaluationKey,
  normalizeAnswer,
  rememberEvaluation,
  resetEvaluationMemory,
} from "@/lib/ai/evaluation-memory";
import type { EvaluationResponse } from "@/lib/validation/schemas";

const sample: EvaluationResponse = {
  is_correct: true,
  confidence: 0.9,
  feedback: "La luz cayó entre las flores.",
  hint: null,
  next_action: "continue",
};

describe("memoria de evaluaciones", () => {
  it("iguala mayúsculas, tildes y signos", () => {
    expect(normalizeAnswer("  ¡En el Jardín!  ")).toBe("en el jardin");
    expect(normalizeAnswer("en   el jardín.")).toBe("en el jardin");
  });

  it("no mezcla signos que no forman palabras", () => {
    expect(normalizeAnswer("???")).not.toBe(normalizeAnswer("!!!"));
  });

  it("repite la evaluación guardada sin volver a pedirla", async () => {
    resetEvaluationMemory();
    let calls = 0;
    const key = evaluationKey({
      title: "Luna",
      question: "¿Dónde cayó?",
      criteria: "Cayó en el jardín.",
      answer: "En el jardín",
      attemptNumber: 1,
    });
    const same = evaluationKey({
      title: "Luna",
      question: "¿Dónde cayó?",
      criteria: "Cayó en el jardín.",
      answer: "en el jardin",
      attemptNumber: 1,
    });

    const first = await rememberEvaluation(key, async () => {
      calls += 1;
      return sample;
    });
    const second = await rememberEvaluation(same, async () => {
      calls += 1;
      return { ...sample, feedback: "otra" };
    });

    expect(calls).toBe(1);
    expect(second.feedback).toBe(first.feedback);
  });

  it("comparte una llamada que todavía no terminó", async () => {
    resetEvaluationMemory();
    let calls = 0;
    let release: (value: EvaluationResponse) => void = () => undefined;
    const pending = new Promise<EvaluationResponse>((resolve) => {
      release = resolve;
    });
    const key = evaluationKey({
      title: "Luna",
      question: "¿Dónde cayó?",
      criteria: "Cayó en el jardín.",
      answer: "entre las flores",
      attemptNumber: 1,
    });

    const first = rememberEvaluation(key, () => {
      calls += 1;
      return pending;
    });
    const second = rememberEvaluation(key, () => {
      calls += 1;
      return pending;
    });
    release(sample);

    await expect(first).resolves.toMatchObject({ feedback: sample.feedback });
    await expect(second).resolves.toMatchObject({ feedback: sample.feedback });
    expect(calls).toBe(1);
  });

  it("no guarda un fallo y permite intentarlo de nuevo", async () => {
    resetEvaluationMemory();
    let calls = 0;
    const key = evaluationKey({
      title: "Luna",
      question: "¿Dónde cayó?",
      criteria: "Cayó en el jardín.",
      answer: "no sé",
      attemptNumber: 2,
    });

    await expect(
      rememberEvaluation(key, async () => {
        calls += 1;
        throw new Error("429");
      }),
    ).rejects.toThrow("429");

    await rememberEvaluation(key, async () => {
      calls += 1;
      return sample;
    });
    expect(calls).toBe(2);
  });
});
