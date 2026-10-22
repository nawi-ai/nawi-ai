import type { EvaluationResponse } from "@/lib/validation/schemas";

const MAX_ENTRIES = 200;

const results = new Map<string, EvaluationResponse>();
const inflight = new Map<string, Promise<EvaluationResponse>>();

export function normalizeAnswer(answer: string) {
  const normalized = answer
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized.length > 0 ? normalized : answer.trim().toLowerCase();
}

export function evaluationKey(input: {
  title: string;
  question: string;
  criteria: string;
  answer: string;
  attemptNumber: number;
}) {
  return JSON.stringify([
    input.attemptNumber,
    input.title,
    input.question,
    input.criteria,
    normalizeAnswer(input.answer),
  ]);
}

export function rememberEvaluation(
  key: string,
  load: () => Promise<EvaluationResponse>,
): Promise<EvaluationResponse> {
  const cached = results.get(key);
  if (cached) return Promise.resolve(cloneEvaluation(cached));

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = load()
    .then((value) => {
      remember(key, value);
      return cloneEvaluation(value);
    })
    .finally(() => {
      if (inflight.get(key) === promise) inflight.delete(key);
    });
  inflight.set(key, promise);
  return promise;
}

export function resetEvaluationMemory() {
  results.clear();
  inflight.clear();
}

function remember(key: string, value: EvaluationResponse) {
  if (results.has(key)) results.delete(key);
  results.set(key, value);
  while (results.size > MAX_ENTRIES) {
    const oldest = results.keys().next().value;
    if (oldest === undefined) break;
    results.delete(oldest);
  }
}

function cloneEvaluation(value: EvaluationResponse): EvaluationResponse {
  return {
    is_correct: value.is_correct,
    confidence: value.confidence,
    feedback: value.feedback,
    hint: value.hint,
    next_action: value.next_action,
  };
}
