export const evaluationJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["is_correct", "confidence", "feedback", "hint", "next_action"],
  properties: {
    is_correct: { type: "boolean" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    feedback: { type: "string" },
    hint: {
      anyOf: [{ type: "string" }, { type: "null" }],
    },
    next_action: {
      type: "string",
      enum: ["continue", "retry", "clarify"],
    },
  },
} as const;
