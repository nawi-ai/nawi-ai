import type { QuestionType, ReadingLevel, SkillId } from "@/lib/reading-level";
import { QUESTION_TYPE_LABEL } from "@/lib/reading-level";
import type { TypeResult } from "@/lib/sessions/flow";

export type StoryRef = {
  id: string;
  level: ReadingLevel;
  title: string;
  skills?: SkillId[];
};

export type Recommendation = {
  strengths: string[];
  recommendation: string;
  supportNote: string;
  nextStoryId: string | null;
};

const STRENGTH_COPY: Record<QuestionType, string> = {
  literal: "Encontraste datos que el cuento dice con claridad.",
  inferential: "Pudiste pensar más allá de la frase exacta.",
  causal: "Explicaste por qué ocurrió algo importante.",
};

const SUPPORT_COPY: Record<QuestionType, string> = {
  literal: "Cuando la respuesta está escrita, puedes volver al cuento y buscar la frase.",
  inferential: "Ya ubicas lo que dice el cuento. Ahora puedes mirar cómo se relacionan los personajes y los hechos.",
  causal: "Para los porqués, busca qué pasó justo antes y qué cambió después.",
};

export function recommendForSession(input: {
  results: TypeResult[];
  stories: StoryRef[];
  preferredLevel: ReadingLevel | null;
  activityLevel: ReadingLevel;
  completedStoryIds: string[];
  focusSkill?: SkillId | null;
}): Recommendation {
  const counted = input.results.filter((result) => !result.pendingReview);
  const strengths = counted.filter((result) => result.correct).map((result) => STRENGTH_COPY[result.type]);
  const missed = counted.filter((result) => !result.correct).map((result) => result.type);
  const supportNote = supportFor(missed);
  const nextStoryId = pickNextStory({
    stories: input.stories,
    preferredLevel: input.preferredLevel,
    activityLevel: input.activityLevel,
    completedStoryIds: input.completedStoryIds,
    missed,
    focusSkill: input.focusSkill,
  });

  const recommendation = recommendationCopy(missed, nextStoryId !== null);
  return { strengths, recommendation, supportNote, nextStoryId };
}

export function recommendFromHistory(input: {
  sessions: Array<{ results: TypeResult[] }>;
  stories: StoryRef[];
  preferredLevel: ReadingLevel | null;
  completedStoryIds: string[];
  focusSkill?: SkillId | null;
}): Recommendation | null {
  if (input.sessions.length === 0) return null;

  const latest = input.sessions[0];
  const base = recommendForSession({
    results: latest?.results ?? [],
    stories: input.stories,
    preferredLevel: input.preferredLevel,
    activityLevel: input.preferredLevel ?? 1,
    completedStoryIds: input.completedStoryIds,
    focusSkill: input.focusSkill,
  });

  const caution =
    input.sessions.length < 2
      ? "Esto es de tu última lectura. Con un solo cuento no vemos una tendencia."
      : repeatedGap(input.sessions);

  return {
    ...base,
    recommendation: caution ? `${base.recommendation} ${caution}` : base.recommendation,
  };
}

export function pickNextStory(input: {
  stories: StoryRef[];
  preferredLevel: ReadingLevel | null;
  activityLevel: ReadingLevel;
  completedStoryIds: string[];
  missed: QuestionType[];
  focusSkill?: SkillId | null;
}) {
  const level = input.missed.includes("literal")
    ? input.activityLevel
    : (input.preferredLevel ?? input.activityLevel);
  const remaining = input.stories.filter(
    (story) => !input.completedStoryIds.includes(story.id) && story.level === level,
  );
  const focused = input.focusSkill
    ? remaining.filter((story) => story.skills?.includes(input.focusSkill as SkillId))
    : [];
  return focused[0]?.id ?? remaining[0]?.id ?? null;
}

function supportFor(missed: QuestionType[]) {
  if (missed.includes("literal")) return SUPPORT_COPY.literal;
  if (missed.includes("inferential")) return SUPPORT_COPY.inferential;
  if (missed.includes("causal")) return SUPPORT_COPY.causal;
  return "Puedes seguir con otro cuento del nivel que elegiste. Ñawi no cambia tu nivel por una sola lectura.";
}

function recommendationCopy(missed: QuestionType[], hasNext: boolean) {
  if (missed.includes("literal")) {
    return "En este cuento conviene volver a buscar la información que está escrita.";
  }
  if (missed.includes("inferential")) {
    return "Las respuestas directas te salieron. La próxima pista es unir lo que hacen los personajes.";
  }
  if (missed.includes("causal")) {
    return "Ya comprendes lo que pasa. Podemos seguir practicando los porqués.";
  }
  if (!hasNext) {
    return "Leíste los cuentos de esta biblioteca. Puedes repetir tu favorito o elegir otro nivel cuando tú quieras.";
  }
  return "Comprendiste muy bien este cuento. Si quieres, elige otra aventura.";
}

function repeatedGap(sessions: Array<{ results: TypeResult[] }>) {
  const misses = new Map<QuestionType, number>();
  for (const session of sessions.slice(0, 3)) {
    for (const result of session.results) {
      if (!result.correct && !result.pendingReview) {
        misses.set(result.type, (misses.get(result.type) ?? 0) + 1);
      }
    }
  }
  const repeated = [...misses.entries()].find(([, count]) => count >= 2);
  if (!repeated) return "";
  return `En más de una lectura apareció «${QUESTION_TYPE_LABEL[repeated[0]]}». Podemos seguir practicándolo, sin apuro.`;
}
