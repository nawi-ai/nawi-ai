import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDemoRepository } from "@/lib/persistence/demo-store";
import type { CompletionPatch } from "@/lib/persistence/types";

let directory = "";

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "nawi-"));
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe("demostración local", () => {
  it("no duplica una sesión activa y no cambia un cierre repetido", async () => {
    const repo = createDemoRepository(directory);
    const readerId = "11111111-1111-4111-8111-111111111111";
    await repo.ensureReader(readerId);
    const first = await repo.createSession({
      readerId,
      storyId: "luna-jardin-estrellas",
      readingLevel: 1,
    });
    const second = await repo.createSession({
      readerId,
      storyId: "luna-jardin-estrellas",
      readingLevel: 2,
    });
    expect(second.id).toBe(first.id);
    expect(second.readingLevel).toBe(1);

    const done = await repo.completeSession(first.id, readerId, patch(67));
    const repeated = await repo.completeSession(first.id, readerId, patch(0));
    expect(done?.status).toBe("completed");
    expect(repeated?.score).toBe(67);
    expect(repeated?.completedAt).toBe(done?.completedAt);
  });

  it("impide leer o responder la sesión de otra persona", async () => {
    const repo = createDemoRepository(directory);
    const owner = "11111111-1111-4111-8111-111111111111";
    const other = "22222222-2222-4222-8222-222222222222";
    await repo.ensureReader(owner);
    await repo.ensureReader(other);
    const session = await repo.createSession({
      readerId: owner,
      storyId: "tomi-rio-cancion",
      readingLevel: 2,
    });

    expect(await repo.getSessionForReader(session.id, other)).toBeNull();
    expect(await repo.listAnswers(session.id, other)).toEqual([]);
    await expect(
      repo.insertAnswer(other, {
        sessionId: session.id,
        questionId: "tomi-q1",
        answerText: "callado",
        isCorrect: true,
        feedback: "no debería guardarse",
        hint: null,
        confidence: 1,
        needsReview: false,
        nextAction: "continue",
        attemptNumber: 1,
      }),
    ).rejects.toMatchObject({ code: "session_closed" });
    expect(await repo.completeSession(session.id, other, patch(100))).toBeNull();
    expect((await repo.getSessionForReader(session.id, owner))?.status).toBe("in_progress");
  });

  it("recupera la respuesta después de crear el repositorio otra vez", async () => {
    const readerId = "11111111-1111-4111-8111-111111111111";
    const first = createDemoRepository(directory);
    await first.ensureReader(readerId);
    const session = await first.createSession({
      readerId,
      storyId: "luna-jardin-estrellas",
      readingLevel: 1,
    });
    await first.insertAnswer(readerId, {
      sessionId: session.id,
      questionId: "luna-q1",
      answerText: "luna-q1-b",
      isCorrect: true,
      feedback: "Muy bien",
      hint: null,
      confidence: 1,
      needsReview: false,
      nextAction: "continue",
      attemptNumber: 1,
    });

    const reloaded = createDemoRepository(directory);
    const answers = await reloaded.listAnswers(session.id, readerId);
    expect(answers).toHaveLength(1);
    expect(answers[0]?.isCorrect).toBe(true);
  });
});

function patch(score: number): CompletionPatch {
  return {
    score,
    correctAnswers: score === 0 ? 0 : 2,
    totalQuestions: 3,
    evaluatedQuestions: 3,
    pendingReview: 0,
    strengths: ["Encontraste datos que el cuento dice con claridad."],
    recommendation: "Puedes leer otro cuento.",
    supportNote: "Ñawi no cambia tu nivel por una sola lectura.",
    nextStoryId: "tomi-rio-cancion",
  };
}
