import "server-only";

import { z } from "zod";

import { AppError } from "@/lib/api/http";
import { requestEvaluation, requestSocraticQuestion } from "@/lib/ai/gemini";
import { loadIdentity, repositoryFor, requireReader } from "@/lib/auth/identity";
import type { ReadingAnswer, ReadingSession } from "@/lib/persistence/types";
import { SKILL_STRENGTH, type ReadingLevel } from "@/lib/reading-level";
import {
  findQuestion,
  getStory,
  getStoryCard,
  listStories,
  storyText,
  toPublicQuestions,
  toReaderStory,
  type StoryQuestion,
} from "@/lib/stories/catalog";
import {
  applyPedagogy,
  attemptsFor,
  resultsByType,
  scoreSession,
  type AttemptSnapshot,
  type RawEvaluation,
} from "@/lib/sessions/flow";
import { expectedAttempt, nextAdaptiveQuestion, questionsOnPath } from "@/lib/sessions/adapt";
import { recommendForSession, recommendFromHistory } from "@/lib/sessions/recommendations";
import { buildSkillProfile, profileSentence } from "@/lib/sessions/skills";
import { contextFromHistory } from "@/lib/tutor/context";
import { focusSkill, masteryFromSeeds, sessionObservations } from "@/lib/tutor/mastery";
import { readMisunderstanding } from "@/lib/tutor/misunderstanding";
import { levelSuggestion } from "@/lib/tutor/policy";
import { localRebound } from "@/lib/tutor/socratic";
import type {
  AnswerView,
  ProgressView,
  SessionDetail,
  SessionView,
  StoryState,
  TypeBreakdown,
} from "@/lib/sessions/views";
import { createSessionSchema, evaluateRequestSchema } from "@/lib/validation/schemas";

export async function createReadingSession(body: unknown) {
  const identity = await requireReader();
  const input = parse(createSessionSchema, body);
  const story = getStory(input.storyId);
  if (!story) {
    throw new AppError(404, "story_not_found", "No encontramos ese cuento.");
  }

  const repository = await repositoryFor(identity.mode);
  await repository.ensureReader(identity.readerId);
  const existing = await repository.findActiveSession(identity.readerId, story.id);
  if (existing) return toSessionView(existing);

  const created = await repository.createSession({
    readerId: identity.readerId,
    storyId: story.id,
    readingLevel: input.readingLevel,
  });
  return toSessionView(created);
}

export async function getSessionDetail(sessionId: string): Promise<SessionDetail> {
  const identity = await requireReader();
  assertUuid(sessionId);
  const repository = await repositoryFor(identity.mode);
  const session = await repository.getSessionForReader(sessionId, identity.readerId);
  if (!session) {
    throw new AppError(404, "session_not_found", "No encontramos esa lectura.");
  }
  const story = getStory(session.storyId);
  if (!story) {
    throw new AppError(404, "story_not_found", "Ese cuento ya no está en la biblioteca.");
  }
  const answers = await repository.listAnswers(session.id, identity.readerId);
  const history = await historySeeds(repository, identity.readerId, session.id);
  return {
    session: toSessionView(session),
    story: toReaderStory(story),
    questions: toPublicQuestions(story),
    answers: answers.map(toAnswerView),
    geminiConfigured: identity.geminiConfigured,
    masterySeeds: history,
  };
}

export async function getReaderSession(sessionId: string) {
  const identity = await requireReader();
  assertUuid(sessionId);
  const repository = await repositoryFor(identity.mode);
  const session = await repository.getSessionForReader(sessionId, identity.readerId);
  if (!session) {
    throw new AppError(404, "session_not_found", "No encontramos esa lectura.");
  }
  const story = getStory(session.storyId);
  if (!story) {
    throw new AppError(404, "story_not_found", "Ese cuento ya no está en la biblioteca.");
  }
  return {
    session: toSessionView(session),
    story: toReaderStory(story),
  };
}

export async function evaluateAttempt(sessionId: string, body: unknown) {
  const identity = await requireReader();
  assertUuid(sessionId);
  const input = parse(evaluateRequestSchema, body);
  const repository = await repositoryFor(identity.mode);
  const session = await repository.getSessionForReader(sessionId, identity.readerId);
  if (!session) {
    throw new AppError(404, "session_not_found", "No encontramos esa lectura.");
  }
  if (session.status !== "in_progress") {
    throw new AppError(409, "session_closed", "Esta lectura ya terminó.");
  }

  const story = getStory(session.storyId);
  const question = story ? findQuestion(story, input.questionId) : null;
  if (!story || !question) {
    throw new AppError(400, "question_mismatch", "Esa pregunta no pertenece a este cuento.");
  }

  const stored = await repository.listAnswers(session.id, identity.readerId);
  const snapshots = stored.map(toSnapshot);
  const history = await historySeeds(repository, identity.readerId, session.id);
  const tutor = contextFromHistory(story.questions, snapshots, history);
  const group = attemptsFor(question.id, snapshots);
  const sameAttempt = group.find((attempt) => attempt.attemptNumber === input.attemptNumber);
  if (sameAttempt) {
    const previous = stored.find(
      (answer) =>
        answer.questionId === question.id && answer.attemptNumber === input.attemptNumber,
    );
    if (previous) return toAnswerView(previous);
  }

  const planned = nextAdaptiveQuestion(story.questions, snapshots, tutor);
  if (planned !== question.id) {
    throw new AppError(409, "question_not_ready", "Esa pregunta todavía no toca.");
  }

  const expected = expectedAttempt(question, story.questions, snapshots);
  if (expected !== input.attemptNumber) {
    throw new AppError(409, "attempt_conflict", "Ese intento ya no corresponde. Recarga la página.");
  }

  const raw =
    question.format === "choice"
      ? choiceEvaluation(question, input.answer)
      : await openEvaluation(identity.readerId, story.title, storyText(story), question, input);

  const final = applyPedagogy(
    raw,
    input.attemptNumber,
    { first: question.hint, second: question.hintStrong },
    question.format === "open",
  );

  const spoken = await tutorReply(identity.readerId, question, input.answer, final);

  const saved = await repository.insertAnswer(identity.readerId, {
    sessionId: session.id,
    questionId: question.id,
    answerText: input.answer,
    isCorrect: final.isCorrect,
    feedback: spoken.feedback,
    hint: spoken.hint,
    confidence: final.confidence,
    needsReview: final.needsReview,
    nextAction: final.nextAction,
    attemptNumber: input.attemptNumber,
  });

  return toAnswerView(saved);
}

export async function completeReading(sessionId: string) {
  const identity = await requireReader();
  assertUuid(sessionId);
  const repository = await repositoryFor(identity.mode);
  const session = await repository.getSessionForReader(sessionId, identity.readerId);
  if (!session) {
    throw new AppError(404, "session_not_found", "No encontramos esa lectura.");
  }
  if (session.status === "completed") return toSessionView(session);

  const story = getStory(session.storyId);
  if (!story) {
    throw new AppError(404, "story_not_found", "Ese cuento ya no está en la biblioteca.");
  }

  const answers = await repository.listAnswers(session.id, identity.readerId);
  const snapshots = answers.map(toSnapshot);
  const previous = await repository.listSessions(identity.readerId);
  const readerAnswers = await repository.listAnswersForReader(identity.readerId);
  const history = seedsFrom(previous, readerAnswers, session.id);
  const tutor = contextFromHistory(story.questions, snapshots, history);
  const path = questionsOnPath(story.questions, snapshots, tutor);
  const scored = scoreSession(path, snapshots);
  if (!scored.complete) {
    throw new AppError(409, "incomplete", "Todavía faltan preguntas por responder.");
  }

  const reader = await repository.ensureReader(identity.readerId);
  const completedStoryIds = previous
    .filter((item) => item.status === "completed")
    .map((item) => item.storyId);
  const mastery = masteryFromSeeds([...history, ...sessionObservations(story.questions, snapshots)]);
  const recommendation = recommendForSession({
    results: resultsByType(
      story.questions.filter((question) => path.includes(question.id)),
      snapshots,
    ),
    stories: storyCatalog(),
    preferredLevel: reader.preferredLevel,
    activityLevel: session.readingLevel,
    completedStoryIds: [...completedStoryIds, story.id],
    focusSkill: focusSkill(mastery),
  });
  const supportNote = joinNotes(recommendation.supportNote, levelSuggestion(mastery));

  const saved = await repository.completeSession(session.id, identity.readerId, {
    score: scored.result.score,
    correctAnswers: scored.result.correct,
    totalQuestions: scored.result.total,
    evaluatedQuestions: scored.result.evaluated,
    pendingReview: scored.result.pendingReview,
    strengths: recommendation.strengths,
    recommendation: recommendation.recommendation,
    supportNote,
    nextStoryId: recommendation.nextStoryId,
  });

  if (!saved) {
    throw new AppError(404, "session_not_found", "No encontramos esa lectura.");
  }
  return toSessionView(saved);
}

export async function savePreferredLevel(level: ReadingLevel) {
  const identity = await requireReader();
  const repository = await repositoryFor(identity.mode);
  const reader = await repository.setPreferredLevel(identity.readerId, level);
  return { preferredLevel: reader.preferredLevel };
}

export async function getProgress(): Promise<ProgressView> {
  const identity = await requireReader();
  const repository = await repositoryFor(identity.mode);
  const reader = await repository.ensureReader(identity.readerId);
  const sessions = await repository.listSessions(identity.readerId);
  const answers = await repository.listAnswersForReader(identity.readerId);
  const cards = listStories();

  const progressSessions = sessions.map((session) => {
    const story = getStory(session.storyId);
    return {
      id: session.id,
      storyId: session.storyId,
      storyTitle: story?.title ?? "Cuento",
      readingLevel: session.readingLevel,
      status: session.status,
      score: session.score,
      correctAnswers: session.correctAnswers,
      totalQuestions: session.totalQuestions,
      pendingReview: session.pendingReview,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
    };
  });

  const completed = sessions.filter((session) => session.status === "completed");
  const history = completed.map((session) => {
    const story = getStory(session.storyId);
    const sessionAnswers = answers.filter((answer) => answer.sessionId === session.id);
    return {
      results: story ? resultsByType(story.questions, sessionAnswers.map(toSnapshot)) : [],
    };
  });

  const mastery = masteryFromSeeds(seedsFrom(completed, answers));
  const advice = recommendFromHistory({
    sessions: history,
    stories: storyCatalog(),
    preferredLevel: reader.preferredLevel,
    completedStoryIds: completed.map((session) => session.storyId),
    focusSkill: focusSkill(mastery),
  });

  const storyStates: StoryState[] = [];
  for (const story of cards) {
    const related = sessions.filter((session) => session.storyId === story.id);
    if (related.some((session) => session.status === "in_progress")) {
      storyStates.push({ storyId: story.id, status: "in_progress" });
    } else if (related.some((session) => session.status === "completed")) {
      storyStates.push({ storyId: story.id, status: "completed" });
    }
  }

  return {
    mode: identity.mode,
    persistenceNote: identity.persistenceNote,
    preferredLevel: reader.preferredLevel,
    completedCount: completed.length,
    sessions: progressSessions,
    storyStates,
    pending: progressSessions.find((session) => session.status === "in_progress") ?? null,
    recommendation: advice?.recommendation ?? null,
    supportNote: joinNotes(advice?.supportNote ?? null, levelSuggestion(mastery)),
    nextStory: advice?.nextStoryId ? getStoryCard(advice.nextStoryId) : null,
    geminiConfigured: identity.geminiConfigured,
    mastery,
    levelNote: levelSuggestion(mastery),
    ...skillProfileFor(completed, answers),
  };
}

export async function getLibraryState() {
  const identity = await requireReader();
  const repository = await repositoryFor(identity.mode);
  const reader = await repository.ensureReader(identity.readerId);
  const sessions = await repository.listSessions(identity.readerId);
  const storyStates: StoryState[] = [];

  for (const story of listStories()) {
    const related = sessions.filter((session) => session.storyId === story.id);
    if (related.some((session) => session.status === "in_progress")) {
      storyStates.push({ storyId: story.id, status: "in_progress" });
    } else if (related.some((session) => session.status === "completed")) {
      storyStates.push({ storyId: story.id, status: "completed" });
    }
  }

  return {
    preferredLevel: reader.preferredLevel,
    storyStates,
  };
}

export async function getHomeState() {
  const identity = await loadIdentity();
  if (identity.kind !== "reader") {
    return { identity, pending: null as HomePending };
  }
  const repository = await repositoryFor(identity.mode);
  const pendingSession = await repository.findLatestInProgress(identity.readerId);
  if (!pendingSession) return { identity, pending: null as HomePending };
  const answers = await repository.listAnswers(pendingSession.id, identity.readerId);
  const story = getStory(pendingSession.storyId);
  const pending: HomePending = {
    id: pendingSession.id,
    storyTitle: story?.title ?? "Tu cuento",
    hasAnswers: answers.length > 0,
  };
  return { identity, pending };
}

type HomePending = {
  id: string;
  storyTitle: string;
  hasAnswers: boolean;
} | null;

export function breakdownFor(detail: SessionDetail): TypeBreakdown[] {
  const story = getStory(detail.session.storyId);
  if (!story) return [];
  const snapshots = detail.answers.map(viewToSnapshot);
  const answered = new Set(detail.answers.map((answer) => answer.questionId));
  return story.questions
    .filter((question) => answered.has(question.id))
    .flatMap((question) => {
      const result = resultsByType([question], snapshots)[0];
      if (!result) return [];
      return [
        {
          id: question.id,
          type: result.type,
          skill: question.skill,
          label: SKILL_STRENGTH[question.skill],
          correct: result.correct,
          pendingReview: result.pendingReview,
        },
      ];
    });
}

function skillProfileFor(
  sessions: Array<{ id: string; storyId: string; status: string }>,
  answers: ReadingAnswer[],
) {
  const completed = [...sessions].reverse().filter((session) => session.status === "completed");
  const entries = completed.flatMap((session) => {
    const story = getStory(session.storyId);
    if (!story) return [];
    return story.questions.flatMap((question) => {
      const attempts = answers
        .filter((answer) => answer.sessionId === session.id && answer.questionId === question.id)
        .map(toSnapshot);
      return attempts.length > 0 ? [{ skill: question.skill, attempts }] : [];
    });
  });
  const skills = buildSkillProfile(entries);
  return { skills, profileNote: profileSentence(skills) };
}

function choiceEvaluation(question: StoryQuestion, answer: string): RawEvaluation {
  const known = question.choices?.some((choice) => choice.id === answer) ?? false;
  if (!known) {
    throw new AppError(400, "invalid_choice", "Elige una de las opciones del cuento.");
  }
  const correct = answer === question.correctChoiceId;
  if (correct) {
    return {
      isCorrect: true,
      confidence: 1,
      feedback: `¡Muy bien! ${question.explanation}`,
      hint: null,
      nextAction: "continue",
    };
  }
  return {
    isCorrect: false,
    confidence: 1,
    feedback: "Todavía no coincide. Mira la pista y vuelve a pensarlo.",
    hint: question.hint,
    nextAction: "retry",
  };
}

async function openEvaluation(
  readerId: string,
  title: string,
  text: string,
  question: StoryQuestion,
  input: { answer: string; attemptNumber: number },
) {
  const model = await requestEvaluation({
    readerId,
    title,
    storyText: text,
    question: question.prompt,
    criteria: question.criteria,
    answer: input.answer,
    attemptNumber: input.attemptNumber,
  });
  return {
    isCorrect: model.is_correct,
    confidence: model.confidence,
    feedback: model.feedback,
    hint: model.hint,
    nextAction: model.next_action,
  } satisfies RawEvaluation;
}

async function historySeeds(
  repository: {
    listSessions(readerId: string): Promise<ReadingSession[]>;
    listAnswersForReader(readerId: string): Promise<ReadingAnswer[]>;
  },
  readerId: string,
  excludeSessionId: string,
) {
  const sessions = await repository.listSessions(readerId);
  const answers = await repository.listAnswersForReader(readerId);
  return seedsFrom(sessions, answers, excludeSessionId);
}

function seedsFrom(sessions: Array<{ id: string; storyId: string; status: string }>, answers: ReadingAnswer[], excludeSessionId?: string) {
  return sessions.flatMap((session) => {
    if (session.status !== "completed" || session.id === excludeSessionId) return [];
    const story = getStory(session.storyId);
    if (!story) return [];
    const attempts = answers.filter((answer) => answer.sessionId === session.id).map(toSnapshot);
    return sessionObservations(story.questions, attempts);
  });
}

function storyCatalog() {
  return listStories().map((story) => ({
    id: story.id,
    level: story.level,
    title: story.title,
    skills: [...new Set(story.questions.filter((question) => question.role === "core").map((question) => question.skill))],
  }));
}

function joinNotes(base: string | null, extra: string | null) {
  return [base, extra].filter((item): item is string => Boolean(item)).join(" ");
}

async function tutorReply(
  readerId: string,
  question: StoryQuestion,
  answer: string,
  final: RawEvaluation,
) {
  if (final.isCorrect) return { feedback: final.feedback, hint: final.hint };
  const said = question.choices?.find((choice) => choice.id === answer)?.label ?? answer;
  const reading = readMisunderstanding(question.skill, [said]);
  const feedback = reading.kind === "unclear" && question.format === "choice" ? final.feedback : reading.verdict;
  const place = final.hint ?? question.hint;
  const fallback = localRebound(said, place) ?? place;
  const correctLabel = question.choices?.find((choice) => choice.id === question.correctChoiceId)?.label;
  const rebound = await requestSocraticQuestion({
    readerId,
    childWords: said,
    placeHint: place,
    forbidden: [question.explanation, correctLabel ?? ""].filter((item) => item.length >= 8),
  });
  return { feedback, hint: rebound ?? fallback };
}

function toSnapshot(answer: ReadingAnswer): AttemptSnapshot {
  return {
    questionId: answer.questionId,
    attemptNumber: answer.attemptNumber,
    isCorrect: answer.isCorrect,
    needsReview: answer.needsReview,
    nextAction: answer.nextAction,
  };
}

function viewToSnapshot(answer: AnswerView): AttemptSnapshot {
  return {
    questionId: answer.questionId,
    attemptNumber: answer.attemptNumber,
    isCorrect: answer.isCorrect,
    needsReview: answer.needsReview,
    nextAction: answer.nextAction,
  };
}

function toSessionView(session: {
  id: string;
  storyId: string;
  readingLevel: ReadingLevel;
  status: "in_progress" | "completed";
  score: number | null;
  correctAnswers: number | null;
  totalQuestions: number | null;
  evaluatedQuestions: number | null;
  pendingReview: number | null;
  strengths: string[];
  recommendation: string | null;
  supportNote: string | null;
  nextStoryId: string | null;
  startedAt: string;
  completedAt: string | null;
}): SessionView {
  return { ...session };
}

function toAnswerView(answer: ReadingAnswer): AnswerView {
  return {
    questionId: answer.questionId,
    attemptNumber: answer.attemptNumber,
    answerText: answer.answerText,
    isCorrect: answer.isCorrect,
    feedback: answer.feedback,
    hint: answer.hint,
    needsReview: answer.needsReview,
    nextAction: answer.nextAction,
  };
}

function assertUuid(value: string) {
  if (!z.string().uuid().safeParse(value).success) {
    throw new AppError(404, "session_not_found", "No encontramos esa lectura.");
  }
}

function parse<T>(schema: z.ZodType<T>, body: unknown) {
  const result = schema.safeParse(body);
  if (!result.success) {
    console.error(
      "nawi_invalid",
      result.error.issues.map((issue) => issue.path.join(".")).join(","),
    );
    throw new AppError(400, "invalid_input", "Revisa lo que enviaste e inténtalo otra vez.");
  }
  return result.data;
}
