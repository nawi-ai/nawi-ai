import type { QuestionType, NextAction } from "@/lib/reading-level";

export const LOW_CONFIDENCE = 0.6;
export const MAX_ATTEMPTS = 2;

export type AttemptSnapshot = {
  questionId: string;
  attemptNumber: number;
  isCorrect: boolean;
  needsReview: boolean;
  nextAction: NextAction;
};

export type RawEvaluation = {
  isCorrect: boolean;
  confidence: number;
  feedback: string;
  hint: string | null;
  nextAction: NextAction;
};

export type LocalHints = {
  first: string;
  second: string;
};

export type FinalEvaluation = RawEvaluation & {
  needsReview: boolean;
};

export type ScoreResult = {
  correct: number;
  incorrect: number;
  evaluated: number;
  pendingReview: number;
  total: number;
  score: number | null;
};

export function attemptsFor(questionId: string, attempts: AttemptSnapshot[]) {
  return attempts
    .filter((attempt) => attempt.questionId === questionId)
    .sort((a, b) => a.attemptNumber - b.attemptNumber);
}

export function isQuestionResolved(attempts: AttemptSnapshot[]) {
  if (attempts.length === 0) return false;
  if (attempts.some((attempt) => attempt.isCorrect && !attempt.needsReview)) return true;
  const latest = attempts[attempts.length - 1];
  return latest.attemptNumber >= MAX_ATTEMPTS && latest.nextAction === "continue";
}

export function nextAttemptNumber(attempts: AttemptSnapshot[]) {
  if (isQuestionResolved(attempts)) return null;
  const latest = attempts[attempts.length - 1];
  return latest ? latest.attemptNumber + 1 : 1;
}

export function applyPedagogy(
  evaluation: RawEvaluation,
  attemptNumber: number,
  hints: LocalHints,
  openEnded: boolean,
): FinalEvaluation {
  const lowConfidence = openEnded && evaluation.confidence < LOW_CONFIDENCE;
  const isCorrect = lowConfidence ? false : evaluation.isCorrect;
  const needsReview = lowConfidence;

  if (isCorrect) {
    return {
      isCorrect: true,
      confidence: evaluation.confidence,
      feedback: evaluation.feedback,
      hint: null,
      nextAction: "continue",
      needsReview: false,
    };
  }

  if (needsReview && attemptNumber < MAX_ATTEMPTS) {
    return {
      isCorrect: false,
      confidence: evaluation.confidence,
      feedback: "Quiero entenderte mejor. ¿Puedes decirlo con otras palabras?",
      hint: hints.first,
      nextAction: "clarify",
      needsReview: true,
    };
  }

  if (attemptNumber < MAX_ATTEMPTS) {
    return {
      isCorrect: false,
      confidence: evaluation.confidence,
      feedback: "Todavía no coincide. Mira la pista y vuelve a pensarlo.",
      hint: hints.first,
      nextAction: "retry",
      needsReview: false,
    };
  }

  return {
    isCorrect: false,
    confidence: evaluation.confidence,
    feedback: needsReview
      ? "Esta respuesta quedó poco clara. No la contaremos como un error."
      : "Todavía no es esa. La pista dice dónde mirar, sin darte la respuesta.",
    hint: hints.second,
    nextAction: "continue",
    needsReview,
  };
}

export function scoreSession(
  questionIds: string[],
  attempts: AttemptSnapshot[],
): { complete: boolean; result: ScoreResult } {
  let correct = 0;
  let incorrect = 0;
  let pendingReview = 0;
  let complete = true;

  for (const questionId of questionIds) {
    const group = attemptsFor(questionId, attempts);
    if (!isQuestionResolved(group)) {
      complete = false;
      continue;
    }
    if (group.some((attempt) => attempt.isCorrect && !attempt.needsReview)) {
      correct += 1;
      continue;
    }
    const latest = group[group.length - 1];
    if (latest?.needsReview) {
      pendingReview += 1;
      continue;
    }
    incorrect += 1;
  }

  const evaluated = correct + incorrect;
  return {
    complete,
    result: {
      correct,
      incorrect,
      evaluated,
      pendingReview,
      total: questionIds.length,
      score: evaluated === 0 ? null : Math.round((correct / evaluated) * 100),
    },
  };
}

export type TypeResult = {
  type: QuestionType;
  correct: boolean;
  pendingReview: boolean;
};

export function resultsByType(
  questions: Array<{ id: string; type: QuestionType }>,
  attempts: AttemptSnapshot[],
): TypeResult[] {
  return questions.map((question) => {
    const group = attemptsFor(question.id, attempts);
    const correct = group.some((attempt) => attempt.isCorrect && !attempt.needsReview);
    const latest = group[group.length - 1];
    return {
      type: question.type,
      correct,
      pendingReview: Boolean(latest?.needsReview) && !correct,
    };
  });
}
