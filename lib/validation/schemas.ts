import { z } from "zod";

export const readingLevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const storyIdSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]{1,80}$/);

export const sessionIdSchema = z.string().uuid();

export const createSessionSchema = z.strictObject({
  storyId: storyIdSchema,
  readingLevel: readingLevelSchema,
});

export const evaluateRequestSchema = z.strictObject({
  questionId: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{1,80}$/),
  answer: z.string().trim().min(1).max(500),
  attemptNumber: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

export const profileSchema = z.strictObject({
  preferredLevel: readingLevelSchema,
});

export const evaluationResponseSchema = z.strictObject({
  is_correct: z.boolean(),
  confidence: z.number().min(0).max(1),
  feedback: z.string().trim().min(1).max(500),
  hint: z.string().trim().max(500).nullable(),
  next_action: z.enum(["continue", "retry", "clarify"]),
});

export type EvaluationResponse = z.infer<typeof evaluationResponseSchema>;
