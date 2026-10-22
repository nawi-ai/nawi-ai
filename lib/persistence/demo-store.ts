import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

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

type StoreData = {
  readers: ReaderRecord[];
  sessions: ReadingSession[];
  answers: ReadingAnswer[];
};

const EMPTY: StoreData = { readers: [], sessions: [], answers: [] };

let lock: Promise<void> = Promise.resolve();

export function createDemoRepository(directory = demoDirectory()): SessionRepository {
  const file = path.join(directory, "nawi-demo.json");

  async function mutate<T>(change: (data: StoreData) => { data: StoreData; result: T }) {
    let release: () => void = () => undefined;
    const previous = lock;
    lock = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      const current = await readStore(file);
      const next = change(current);
      await writeStore(file, next.data);
      return next.result;
    } finally {
      release();
    }
  }

  return {
    mode: "demo",
    async ensureReader(id) {
      return mutate((data) => {
        const found = data.readers.find((reader) => reader.id === id);
        if (found) return { data, result: found };
        const now = new Date().toISOString();
        const reader: ReaderRecord = {
          id,
          preferredLevel: null,
          createdAt: now,
          updatedAt: now,
        };
        data.readers.push(reader);
        return { data, result: reader };
      });
    },
    async setPreferredLevel(id, level) {
      return mutate((data) => {
        const reader = data.readers.find((item) => item.id === id);
        if (!reader) {
          throw new AppError(401, "reader_missing", "No encontramos tu espacio de lectura.");
        }
        reader.preferredLevel = level;
        reader.updatedAt = new Date().toISOString();
        return { data, result: reader };
      });
    },
    async findActiveSession(readerId, storyId) {
      const data = await readStore(file);
      return (
        data.sessions.find(
          (session) =>
            session.readerId === readerId &&
            session.storyId === storyId &&
            session.status === "in_progress",
        ) ?? null
      );
    },
    async findLatestInProgress(readerId) {
      const data = await readStore(file);
      return (
        data.sessions
          .filter((session) => session.readerId === readerId && session.status === "in_progress")
          .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null
      );
    },
    async createSession(input) {
      return mutate((data) => {
        const existing = data.sessions.find(
          (session) =>
            session.readerId === input.readerId &&
            session.storyId === input.storyId &&
            session.status === "in_progress",
        );
        if (existing) return { data, result: existing };
        const session = blankSession(input);
        data.sessions.push(session);
        return { data, result: session };
      });
    },
    async getSessionForReader(id, readerId) {
      const data = await readStore(file);
      return data.sessions.find((session) => session.id === id && session.readerId === readerId) ?? null;
    },
    async listSessions(readerId) {
      const data = await readStore(file);
      return data.sessions
        .filter((session) => session.readerId === readerId)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    },
    async listAnswers(sessionId, readerId) {
      const data = await readStore(file);
      const session = data.sessions.find((item) => item.id === sessionId && item.readerId === readerId);
      if (!session) return [];
      return data.answers
        .filter((answer) => answer.sessionId === sessionId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    async listAnswersForReader(readerId) {
      const data = await readStore(file);
      const ids = new Set(
        data.sessions.filter((session) => session.readerId === readerId).map((session) => session.id),
      );
      return data.answers.filter((answer) => ids.has(answer.sessionId));
    },
    async insertAnswer(readerId, answer) {
      return mutate((data) => {
        const session = data.sessions.find(
          (item) => item.id === answer.sessionId && item.readerId === readerId,
        );
        if (!session || session.status !== "in_progress") {
          throw new AppError(409, "session_closed", "Esta lectura ya no acepta respuestas.");
        }
        const existing = data.answers.find(
          (item) =>
            item.sessionId === answer.sessionId &&
            item.questionId === answer.questionId &&
            item.attemptNumber === answer.attemptNumber,
        );
        if (existing) return { data, result: existing };
        const stored: ReadingAnswer = {
          ...answer,
          id: randomUUID(),
          createdAt: new Date().toISOString(),
        };
        data.answers.push(stored);
        return { data, result: stored };
      });
    },
    async completeSession(id, readerId, patch) {
      return mutate((data) => {
        const session = data.sessions.find((item) => item.id === id && item.readerId === readerId);
        if (!session) return { data, result: null };
        if (session.status === "completed") return { data, result: session };
        applyCompletion(session, patch);
        return { data, result: session };
      });
    },
  };
}

export function demoDirectory() {
  return process.env.NAWI_DATA_DIR?.trim() || path.join(process.cwd(), ".data");
}

function blankSession(input: {
  readerId: string;
  storyId: string;
  readingLevel: ReadingLevel;
}): ReadingSession {
  return {
    id: randomUUID(),
    readerId: input.readerId,
    storyId: input.storyId,
    readingLevel: input.readingLevel,
    status: "in_progress",
    score: null,
    correctAnswers: null,
    totalQuestions: null,
    evaluatedQuestions: null,
    pendingReview: null,
    strengths: [],
    recommendation: null,
    supportNote: null,
    nextStoryId: null,
    startedAt: new Date().toISOString(),
    completedAt: null,
  };
}

function applyCompletion(session: ReadingSession, patch: CompletionPatch) {
  session.status = "completed";
  session.score = patch.score;
  session.correctAnswers = patch.correctAnswers;
  session.totalQuestions = patch.totalQuestions;
  session.evaluatedQuestions = patch.evaluatedQuestions;
  session.pendingReview = patch.pendingReview;
  session.strengths = patch.strengths;
  session.recommendation = patch.recommendation;
  session.supportNote = patch.supportNote;
  session.nextStoryId = patch.nextStoryId;
  session.completedAt = new Date().toISOString();
}

async function readStore(file: string): Promise<StoreData> {
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as StoreData;
    return {
      readers: parsed.readers ?? [],
      sessions: parsed.sessions ?? [],
      answers: parsed.answers ?? [],
    };
  } catch (error) {
    if (isMissing(error)) return structuredClone(EMPTY);
    throw new AppError(500, "demo_store", "No pudimos leer la demostración local.");
  }
}

async function writeStore(file: string, data: StoreData) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data), "utf8");
}

function isMissing(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ENOENT"
  );
}

export type { NewAnswer };
