import { describe, expect, it } from "vitest";

import { isRetryableGeminiError } from "@/lib/ai/gemini-retry";

describe("reintento de Gemini", () => {
  it("no repite un cupo agotado", () => {
    expect(isRetryableGeminiError(new Error("429 RESOURCE_EXHAUSTED"), 0)).toBe(false);
    expect(isRetryableGeminiError(new Error("quota exceeded"), 0)).toBe(false);
  });

  it("repite una vez un corte de red", () => {
    expect(isRetryableGeminiError(new Error("503 UNAVAILABLE"), 0)).toBe(true);
    expect(isRetryableGeminiError(new Error("503 UNAVAILABLE"), 1)).toBe(false);
  });
});