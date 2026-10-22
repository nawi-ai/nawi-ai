import type { NextAction, ReadingLevel } from "@/lib/reading-level";

export type ReaderRecord = {
  id: string;
  preferredLevel: ReadingLevel | null;
  createdAt: string;
  updatedAt: string;
};

export type SessionStatus = "in_progress" | "completed";

export type ReadingSession = {
  id: string;
  readerId: string;
  storyId: string;
  readingLevel: ReadingLevel;
  status: SessionStatus;
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
};

export type ReadingAnswer = {
  id: string;
  sessionId: string;
  questionId: string;
  answerText: string;
  isCorrect: boolean;
  feedback: string;
  hint: string | null;
  confidence: number;
  needsReview: boolean;
  nextAction: NextAction;
  attemptNumber: number;
  createdAt: string;
};

export type NewAnswer = Omit<ReadingAnswer, "id" | "createdAt">;

export type CompletionPatch = {
  score: number | null;
  correctAnswers: number;
  totalQuestions: number;
  evaluatedQuestions: number;
  pendingReview: number;
  strengths: string[];
  recommendation: string;
  supportNote: string;
  nextStoryId: string | null;
};

export type SessionRepository = {
  mode: "demo" | "supabase";
  ensureReader(id: string): Promise<ReaderRecord>;
  setPreferredLevel(id: string, level: ReadingLevel): Promise<ReaderRecord>;
  findActiveSession(readerId: string, storyId: string): Promise<ReadingSession | null>;
  findLatestInProgress(readerId: string): Promise<ReadingSession | null>;
  createSession(input: {
    readerId: string;
    storyId: string;
    readingLevel: ReadingLevel;
  }): Promise<ReadingSession>;
  getSessionForReader(id: string, readerId: string): Promise<ReadingSession | null>;
  listSessions(readerId: string): Promise<ReadingSession[]>;
  listAnswers(sessionId: string, readerId: string): Promise<ReadingAnswer[]>;
  listAnswersForReader(readerId: string): Promise<ReadingAnswer[]>;
  insertAnswer(readerId: string, answer: NewAnswer): Promise<ReadingAnswer>;
  completeSession(
    id: string,
    readerId: string,
    patch: CompletionPatch,
  ): Promise<ReadingSession | null>;
};
