import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { AppError } from "@/lib/api/http";
import type { ReadingLevel } from "@/lib/reading-level";
import type {
  CompletionPatch,
  NewAnswer,
  ReaderRecord,
  ReadingAnswer,
  ReadingSession,
  SessionRepository,
} from "@/lib/persistence/types";

const levelSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.null()]);

const readerRow = z.object({
  id: z.string().uuid(),
  preferred_level: levelSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

const sessionRow = z.object({
  id: z.string().uuid(),
  reader_id: z.string().uuid(),
  story_id: z.string(),
  reading_level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  status: z.enum(["in_progress", "completed"]),
  score: z.number().int().nullable(),
  correct_answers: z.number().int().nullable(),
  total_questions: z.number().int().nullable(),
  evaluated_questions: z.number().int().nullable(),
  pending_review: z.number().int().nullable(),
  strengths: z.array(z.string()),
  recommendation: z.string().nullable(),
  support_note: z.string().nullable(),
  next_story_id: z.string().nullable(),
  started_at: z.string(),
  completed_at: z.string().nullable(),
});

const answerRow = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  question_id: z.string(),
  answer_text: z.string(),
  is_correct: z.boolean(),
  feedback: z.string(),
  hint: z.string().nullable(),
  confidence: z.number(),
  needs_review: z.boolean(),
  next_action: z.enum(["continue", "retry", "clarify"]),
  attempt_number: z.number().int(),
  created_at: z.string(),
});

type DbError = { code?: string; message?: string } | null;

export function createSupabaseRepository(
  user: SupabaseClient,
  admin: SupabaseClient,
): SessionRepository {
  return {
    mode: "supabase",
    async ensureReader(id) {
      const { data, error } = await user
        .from("reader_profiles")
        .select("id, preferred_level, created_at, updated_at")
        .eq("id", id)
        .maybeSingle();
      throwIfDb(error);
      if (data) return mapReader(data);

      const { error: insertError } = await user.from("reader_profiles").insert({ id });
      throwIfDb(insertError);
      const created = await user
        .from("reader_profiles")
        .select("id, preferred_level, created_at, updated_at")
        .eq("id", id)
        .single();
      throwIfDb(created.error);
      return mapReader(created.data);
    },
    async setPreferredLevel(id, level) {
      const { data, error } = await user
        .from("reader_profiles")
        .update({ preferred_level: level, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("id, preferred_level, created_at, updated_at")
        .single();
      throwIfDb(error);
      return mapReader(data);
    },
    async findActiveSession(readerId, storyId) {
      const { data, error } = await user
        .from("reading_sessions")
        .select(SESSION_COLUMNS)
        .eq("reader_id", readerId)
        .eq("story_id", storyId)
        .eq("status", "in_progress")
        .maybeSingle();
      throwIfDb(error);
      return data ? mapSession(data) : null;
    },
    async findLatestInProgress(readerId) {
      const { data, error } = await user
        .from("reading_sessions")
        .select(SESSION_COLUMNS)
        .eq("reader_id", readerId)
        .eq("status", "in_progress")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      throwIfDb(error);
      return data ? mapSession(data) : null;
    },
    async createSession(input) {
      const existing = await this.findActiveSession(input.readerId, input.storyId);
      if (existing) return existing;

      const { data, error } = await admin
        .from("reading_sessions")
        .insert({
          reader_id: input.readerId,
          story_id: input.storyId,
          reading_level: input.readingLevel,
          status: "in_progress",
        })
        .select(SESSION_COLUMNS)
        .single();

      if (error?.code === "23505") {
        const raced = await this.findActiveSession(input.readerId, input.storyId);
        if (raced) return raced;
      }
      throwIfDb(error);
      return mapSession(data);
    },
    async getSessionForReader(id, readerId) {
      const { data, error } = await user
        .from("reading_sessions")
        .select(SESSION_COLUMNS)
        .eq("id", id)
        .eq("reader_id", readerId)
        .maybeSingle();
      throwIfDb(error);
      return data ? mapSession(data) : null;
    },
    async listSessions(readerId) {
      const { data, error } = await user
        .from("reading_sessions")
        .select(SESSION_COLUMNS)
        .eq("reader_id", readerId)
        .order("started_at", { ascending: false });
      throwIfDb(error);
      return (data ?? []).map(mapSession);
    },
    async listAnswers(sessionId, readerId) {
      const session = await this.getSessionForReader(sessionId, readerId);
      if (!session) return [];
      const { data, error } = await user
        .from("reading_answers")
        .select(ANSWER_COLUMNS)
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      throwIfDb(error);
      return (data ?? []).map(mapAnswer);
    },
    async listAnswersForReader(readerId) {
      const sessions = await this.listSessions(readerId);
      const ids = sessions.map((session) => session.id);
      if (ids.length === 0) return [];
      const { data, error } = await user
        .from("reading_answers")
        .select(ANSWER_COLUMNS)
        .in("session_id", ids);
      throwIfDb(error);
      return (data ?? []).map(mapAnswer);
    },
    async insertAnswer(readerId, answer) {
      const session = await this.getSessionForReader(answer.sessionId, readerId);
      if (!session || session.status !== "in_progress") {
        throw new AppError(409, "session_closed", "Esta lectura ya no acepta respuestas.");
      }

      const { data, error } = await admin
        .from("reading_answers")
        .insert(answerToRow(answer))
        .select(ANSWER_COLUMNS)
        .single();

      if (error?.code === "23505") {
        const answers = await this.listAnswers(answer.sessionId, readerId);
        const existing = answers.find(
          (item) =>
            item.questionId === answer.questionId && item.attemptNumber === answer.attemptNumber,
        );
        if (existing) return existing;
      }
      throwIfDb(error);
      return mapAnswer(data);
    },
    async completeSession(id, readerId, patch) {
      const current = await this.getSessionForReader(id, readerId);
      if (!current) return null;
      if (current.status === "completed") return current;

      const { data, error } = await admin
        .from("reading_sessions")
        .update(completionToRow(patch))
        .eq("id", id)
        .eq("reader_id", readerId)
        .eq("status", "in_progress")
        .select(SESSION_COLUMNS)
        .maybeSingle();
      throwIfDb(error);
      if (data) return mapSession(data);

      const again = await this.getSessionForReader(id, readerId);
      return again?.status === "completed" ? again : null;
    },
  };
}

const SESSION_COLUMNS =
  "id, reader_id, story_id, reading_level, status, score, correct_answers, total_questions, evaluated_questions, pending_review, strengths, recommendation, support_note, next_story_id, started_at, completed_at";

const ANSWER_COLUMNS =
  "id, session_id, question_id, answer_text, is_correct, feedback, hint, confidence, needs_review, next_action, attempt_number, created_at";

function mapReader(row: unknown): ReaderRecord {
  const parsed = readerRow.parse(row);
  return {
    id: parsed.id,
    preferredLevel: parsed.preferred_level,
    createdAt: parsed.created_at,
    updatedAt: parsed.updated_at,
  };
}

function mapSession(row: unknown): ReadingSession {
  const parsed = sessionRow.parse(row);
  return {
    id: parsed.id,
    readerId: parsed.reader_id,
    storyId: parsed.story_id,
    readingLevel: parsed.reading_level,
    status: parsed.status,
    score: parsed.score,
    correctAnswers: parsed.correct_answers,
    totalQuestions: parsed.total_questions,
    evaluatedQuestions: parsed.evaluated_questions,
    pendingReview: parsed.pending_review,
    strengths: parsed.strengths,
    recommendation: parsed.recommendation,
    supportNote: parsed.support_note,
    nextStoryId: parsed.next_story_id,
    startedAt: parsed.started_at,
    completedAt: parsed.completed_at,
  };
}

function mapAnswer(row: unknown): ReadingAnswer {
  const parsed = answerRow.parse(row);
  return {
    id: parsed.id,
    sessionId: parsed.session_id,
    questionId: parsed.question_id,
    answerText: parsed.answer_text,
    isCorrect: parsed.is_correct,
    feedback: parsed.feedback,
    hint: parsed.hint,
    confidence: parsed.confidence,
    needsReview: parsed.needs_review,
    nextAction: parsed.next_action,
    attemptNumber: parsed.attempt_number,
    createdAt: parsed.created_at,
  };
}

function answerToRow(answer: NewAnswer) {
  return {
    session_id: answer.sessionId,
    question_id: answer.questionId,
    answer_text: answer.answerText,
    is_correct: answer.isCorrect,
    feedback: answer.feedback,
    hint: answer.hint,
    confidence: answer.confidence,
    needs_review: answer.needsReview,
    next_action: answer.nextAction,
    attempt_number: answer.attemptNumber,
  };
}

function completionToRow(patch: CompletionPatch) {
  return {
    status: "completed",
    score: patch.score,
    correct_answers: patch.correctAnswers,
    total_questions: patch.totalQuestions,
    evaluated_questions: patch.evaluatedQuestions,
    pending_review: patch.pendingReview,
    strengths: patch.strengths,
    recommendation: patch.recommendation,
    support_note: patch.supportNote,
    next_story_id: patch.nextStoryId,
    completed_at: new Date().toISOString(),
  };
}

function throwIfDb(error: DbError): asserts error is null {
  if (!error) return;
  console.error("nawi_persistence", error.code ?? "unknown", error.message ?? "");
  if (error.code === "42P01" || error.code === "PGRST205") {
    throw new AppError(
      503,
      "migration_missing",
      "Falta aplicar la migración SQL de Ñawi en Supabase.",
    );
  }
  throw new AppError(500, "persistence", "No pudimos guardar o leer tu lectura.");
}

export type { ReadingLevel };
