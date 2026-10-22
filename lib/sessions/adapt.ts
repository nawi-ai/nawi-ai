import {
  attemptsFor,
  isQuestionResolved,
  MAX_ATTEMPTS,
  nextAttemptNumber,
  type AttemptSnapshot,
} from "@/lib/sessions/flow";

export type AdaptiveQuestion = {
  id: string;
  role: "core" | "support" | "challenge";
  supportsQuestionId?: string;
};

function groupFor(questionId: string, attempts: AttemptSnapshot[]) {
  return attemptsFor(questionId, attempts);
}

function answeredCorrectly(attempts: AttemptSnapshot[]) {
  return attempts.some((attempt) => attempt.isCorrect && !attempt.needsReview);
}

export function needsRecovery(
  question: AdaptiveQuestion,
  questions: AdaptiveQuestion[],
  attempts: AttemptSnapshot[],
) {
  if (question.role === "support") return false;
  const group = groupFor(question.id, attempts);
  if (!isQuestionResolved(group) || answeredCorrectly(group)) return false;
  if (group.some((attempt) => attempt.attemptNumber > MAX_ATTEMPTS)) return false;
  const support = questions.find(
    (item) => item.role === "support" && item.supportsQuestionId === question.id,
  );
  if (!support) return false;
  const supportGroup = groupFor(support.id, attempts);
  return isQuestionResolved(supportGroup) && answeredCorrectly(supportGroup);
}

export function isQuestionClosed(
  question: AdaptiveQuestion,
  questions: AdaptiveQuestion[],
  attempts: AttemptSnapshot[],
) {
  const group = groupFor(question.id, attempts);
  if (!isQuestionResolved(group)) return false;
  return !needsRecovery(question, questions, attempts);
}

export function expectedAttempt(
  question: AdaptiveQuestion,
  questions: AdaptiveQuestion[],
  attempts: AttemptSnapshot[],
) {
  const standard = nextAttemptNumber(groupFor(question.id, attempts));
  if (standard !== null) return standard;
  if (needsRecovery(question, questions, attempts)) return MAX_ATTEMPTS + 1;
  return null;
}

function firstTryStreak(questions: AdaptiveQuestion[], attempts: AttemptSnapshot[]) {
  let streak = 0;
  for (const question of questions) {
    if (question.role !== "core") continue;
    if (!isQuestionClosed(question, questions, attempts)) break;
    const first = groupFor(question.id, attempts).find((attempt) => attempt.attemptNumber === 1);
    if (first?.isCorrect && !first.needsReview) streak += 1;
    else streak = 0;
  }
  return streak;
}

export function nextAdaptiveQuestion(
  questions: AdaptiveQuestion[],
  attempts: AttemptSnapshot[],
) {
  const reopened = questions.find((question) => {
    const group = groupFor(question.id, attempts);
    return group.length > 0 && !isQuestionClosed(question, questions, attempts);
  });
  if (reopened) return reopened.id;

  const supportDue = questions.find((question) => {
    if (question.role !== "support" || !question.supportsQuestionId) return false;
    if (groupFor(question.id, attempts).length > 0) return false;
    const parent = questions.find((item) => item.id === question.supportsQuestionId);
    if (!parent || !isQuestionResolved(groupFor(parent.id, attempts))) return false;
    if (answeredCorrectly(groupFor(parent.id, attempts))) return false;
    if (groupFor(parent.id, attempts).some((attempt) => attempt.attemptNumber > MAX_ATTEMPTS)) {
      return false;
    }
    return true;
  });
  if (supportDue) return supportDue.id;

  const challenge = questions.find(
    (question) => question.role === "challenge" && groupFor(question.id, attempts).length === 0,
  );
  if (challenge && firstTryStreak(questions, attempts) >= 2) return challenge.id;

  const nextCore = questions.find(
    (question) => question.role === "core" && groupFor(question.id, attempts).length === 0,
  );
  return nextCore?.id ?? null;
}

export function questionsOnPath(questions: AdaptiveQuestion[], attempts: AttemptSnapshot[]) {
  const ids = questions
    .filter((question) => question.role === "core" || groupFor(question.id, attempts).length > 0)
    .map((question) => question.id);
  const next = nextAdaptiveQuestion(questions, attempts);
  if (next && !ids.includes(next)) ids.push(next);
  return ids;
}
