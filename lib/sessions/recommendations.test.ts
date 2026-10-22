import { describe, expect, it } from "vitest";

import { recommendForSession, recommendFromHistory } from "@/lib/sessions/recommendations";

const stories = [
  { id: "luna-jardin-estrellas", level: 1 as const, title: "Luna" },
  { id: "tomi-rio-cancion", level: 2 as const, title: "Tomi" },
  { id: "killa-montana-colores", level: 3 as const, title: "Killa" },
];

describe("recomendaciones", () => {
  it("pide volver al texto cuando falla lo literal", () => {
    const advice = recommendForSession({
      results: [
        { type: "literal", correct: false, pendingReview: false },
        { type: "inferential", correct: true, pendingReview: false },
        { type: "causal", correct: true, pendingReview: false },
      ],
      stories,
      preferredLevel: 2,
      activityLevel: 2,
      completedStoryIds: ["tomi-rio-cancion"],
    });
    expect(advice.supportNote).toMatch(/buscar la frase/i);
    expect(advice.recommendation).toMatch(/escrita/i);
    expect(advice.nextStoryId).not.toBe("tomi-rio-cancion");
  });

  it("no cambia el nivel por una lectura bien resuelta", () => {
    const advice = recommendForSession({
      results: [
        { type: "literal", correct: true, pendingReview: false },
        { type: "inferential", correct: true, pendingReview: false },
        { type: "causal", correct: true, pendingReview: false },
      ],
      stories,
      preferredLevel: 1,
      activityLevel: 1,
      completedStoryIds: ["luna-jardin-estrellas"],
    });
    expect(advice.supportNote).toMatch(/no cambia tu nivel/i);
    expect(advice.nextStoryId).toBeNull();
  });

  it("advierte que una sola sesión no es una tendencia", () => {
    const advice = recommendFromHistory({
      sessions: [
        {
          results: [{ type: "literal", correct: true, pendingReview: false }],
        },
      ],
      stories,
      preferredLevel: 1,
      completedStoryIds: ["luna-jardin-estrellas"],
    });
    expect(advice?.recommendation).toMatch(/no vemos una tendencia/i);
  });

  it("no inventa una recomendación sin lecturas", () => {
    expect(
      recommendFromHistory({
        sessions: [],
        stories,
        preferredLevel: null,
        completedStoryIds: [],
      }),
    ).toBeNull();
  });
});
