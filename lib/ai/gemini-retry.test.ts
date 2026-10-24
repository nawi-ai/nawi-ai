import { describe, expect, it } from "vitest";

import { isRetryableGeminiError } from "@/lib/ai/gemini-retry";

describe("reintento de Gemini", () => {
  it("no repite un cupo agotado", () => {
    expect(isRetryableGeminiError(new Error("429 RESOURCE_EXHAUSTED"), 0)).toBe(false);
    expect(isRetryableGeminiError(new Error("quota exceeded"), 0)).toBe(false);
  });

  it("repite una vez un corte de red", () => {
    expect(isRetryableGeminiError(new Error("fetch failed"), 0)).toBe(true);
    expect(isRetryableGeminiError(new Error("fetch failed"), 1)).toBe(false);
  });

  it("no repite cuando el modelo está ocupado", () => {
    expect(isRetryableGeminiError(Object.assign(new Error("UNAVAILABLE"), { status: 503 }), 0)).toBe(false);
    expect(isRetryableGeminiError(Object.assign(new Error("DEADLINE_EXCEEDED"), { status: 504 }), 0)).toBe(false);
  });

  it("usa el estado del SDK cuando el mensaje no trae el código", () => {
    expect(isRetryableGeminiError(Object.assign(new Error("server error"), { status: 500 }), 0)).toBe(true);
    expect(isRetryableGeminiError(Object.assign(new Error("bad request"), { status: 400 }), 0)).toBe(false);
    expect(isRetryableGeminiError(Object.assign(new Error("billing"), { status: 402 }), 0)).toBe(false);
  });

  it("no repite el corte de los 20 segundos", () => {
    expect(isRetryableGeminiError(new Error("The operation was aborted due to timeout"), 0)).toBe(false);
  });
});