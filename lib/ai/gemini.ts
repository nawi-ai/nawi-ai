import "server-only";

import { GoogleGenAI } from "@google/genai";

import { AppError } from "@/lib/api/http";
import { assertEvaluationRate } from "@/lib/ai/rate-limit";
import { evaluationKey, rememberEvaluation } from "@/lib/ai/evaluation-memory";
import { evaluationJsonSchema } from "@/lib/ai/evaluation-schema";
import { isRetryableGeminiError } from "@/lib/ai/gemini-retry";
import { EVALUATION_SYSTEM, evaluationPrompt } from "@/lib/ai/prompts";
import { evaluationResponseSchema, type EvaluationResponse } from "@/lib/validation/schemas";
import { geminiConfig } from "@/lib/env.server";
import { acceptSocraticQuestion } from "@/lib/tutor/socratic";

const TIMEOUT_MS = 20_000;

export async function requestEvaluation(input: {
  readerId: string;
  title: string;
  storyText: string;
  question: string;
  criteria: string;
  answer: string;
  attemptNumber: number;
}): Promise<EvaluationResponse> {
  const config = geminiConfig();
  if (!config) {
    throw new AppError(
      503,
      "ai_not_configured",
      "La evaluación de respuestas abiertas necesita Gemini. Agrega GEMINI_API_KEY y GEMINI_MODEL para continuar esta pregunta.",
    );
  }

  const key = evaluationKey(input);
  return rememberEvaluation(key, () => {
    assertEvaluationRate(input.readerId);
    return callGemini(config, input);
  });
}

async function callGemini(
  config: { apiKey: string; model: string },
  input: {
    title: string;
    storyText: string;
    question: string;
    criteria: string;
    answer: string;
    attemptNumber: number;
  },
) {
  const ai = new GoogleGenAI({ apiKey: config.apiKey });
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model: config.model,
        contents: evaluationPrompt(input),
        config: {
          systemInstruction: EVALUATION_SYSTEM,
          temperature: 0.2,
          maxOutputTokens: 400,
          responseMimeType: "application/json",
          responseJsonSchema: evaluationJsonSchema,
          abortSignal: AbortSignal.timeout(TIMEOUT_MS),
        },
      });
      return parseEvaluation(response.text);
    } catch (error) {
      lastError = error;
      if (error instanceof AppError || !isRetryableGeminiError(error, attempt)) break;
    }
  }

  throw mapGeminiError(lastError);
}

function parseEvaluation(text: string | undefined) {
  if (!text) {
    throw new AppError(
      502,
      "ai_invalid_response",
      "Ñawi no pudo leer la evaluación. Puedes intentarlo otra vez.",
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(extractJson(text));
  } catch {
    throw new AppError(
      502,
      "ai_invalid_response",
      "Ñawi no pudo leer la evaluación. Puedes intentarlo otra vez.",
    );
  }

  if (payload && typeof payload === "object" && "hint" in payload) {
    const hint = (payload as { hint?: unknown }).hint;
    if (typeof hint === "string" && hint.trim() === "") {
      (payload as { hint: string | null }).hint = null;
    }
  }

  const parsed = evaluationResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new AppError(
      502,
      "ai_invalid_response",
      "Ñawi no pudo leer la evaluación. Puedes intentarlo otra vez.",
    );
  }
  return parsed.data;
}

function extractJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) return text;
  return text.slice(start, end + 1);
}

function mapGeminiError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/timeout|aborted|AbortError/i.test(message)) {
    return new AppError(504, "ai_timeout", "La evaluación tardó demasiado. Puedes intentarlo otra vez.");
  }
  if (/429|RESOURCE_EXHAUSTED|quota/i.test(message)) {
    return new AppError(429, "ai_quota", "Ahora hay muchas evaluaciones. Espera un momento e inténtalo otra vez.");
  }
  return new AppError(502, "ai_unavailable", "No pudimos evaluar esta respuesta ahora. Puedes intentarlo otra vez.");
}

export async function requestSocraticQuestion(input: {
  readerId: string;
  childWords: string;
  placeHint: string;
  forbidden: string[];
}): Promise<string | null> {
  const config = geminiConfig();
  if (!config) return null;
  try {
    assertEvaluationRate(input.readerId);
    const ai = new GoogleGenAI({ apiKey: config.apiKey });
    const response = await ai.models.generateContent({
      model: config.model,
      contents: [
        "Escribe una sola pregunta para un niño de 6 a 8 años.",
        "Empieza citando lo que dijo, con la palabra Dijiste.",
        "No des la respuesta. No digas cuál opción era. No inventes hechos.",
        "La pregunta solo señala el lugar de la pista.",
        `El niño dijo: ${input.childWords}`,
        `Lugar para mirar: ${input.placeHint}`,
        'Devuelve JSON {"question":"..."} con una sola pregunta.',
      ].join("\n"),
      config: {
        systemInstruction:
          "Eres un tutor socrático de lectura. Haces una pregunta a partir de lo que el niño dijo. No entregas la respuesta ni eliges la siguiente actividad.",
        temperature: 0.3,
        maxOutputTokens: 180,
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          properties: { question: { type: "string" } },
          required: ["question"],
        },
        abortSignal: AbortSignal.timeout(TIMEOUT_MS),
      },
    });
    const payload = JSON.parse(extractJson(response.text ?? "")) as { question?: unknown };
    return typeof payload.question === "string"
      ? acceptSocraticQuestion(payload.question, input.forbidden, input.childWords)
      : null;
  } catch {
    return null;
  }
}
