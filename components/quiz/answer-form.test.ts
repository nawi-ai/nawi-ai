import { describe, expect, it } from "vitest";

import { shouldShowAnswerForm } from "@/components/quiz/answer-form";

describe("formulario al volver a la pregunta", () => {
  it("muestra las opciones cuando se regresa después de la ayuda", () => {
    expect(
      shouldShowAnswerForm({
        closed: false,
        showingResult: false,
        returned: true,
        nextAction: "continue",
      }),
    ).toBe(true);
  });

  it("oculta las opciones cuando la pregunta ya se cerró", () => {
    expect(
      shouldShowAnswerForm({
        closed: true,
        showingResult: true,
        returned: false,
        nextAction: "continue",
      }),
    ).toBe(false);
  });

  it("sigue mostrando las opciones en el primer reintento", () => {
    expect(
      shouldShowAnswerForm({
        closed: false,
        showingResult: true,
        returned: false,
        nextAction: "retry",
      }),
    ).toBe(true);
  });
});
