import type { NextAction, QuestionType, ReadingLevel, SkillId } from "@/lib/reading-level";
import type { SkillProfileItem } from "@/lib/sessions/skills";
import type { MasterySeed, SkillMastery } from "@/lib/tutor/mastery";
import type { PublicQuestion, ReaderStory, StoryCard } from "@/lib/stories/public";

export type AnswerView = {
  questionId: string;
  attemptNumber: number;
  answerText: string;
  isCorrect: boolean;
  feedback: string;
  hint: string | null;
  needsReview: boolean;
  nextAction: NextAction;
};

export type SessionView = {
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
};

export type SessionDetail = {
  session: SessionView;
  story: ReaderStory;
  questions: PublicQuestion[];
  answers: AnswerView[];
  geminiConfigured: boolean;
  masterySeeds: MasterySeed[];
};

export type StoryState = {
  storyId: string;
  status: "in_progress" | "completed";
};

export type ProgressSession = {
  id: string;
  storyId: string;
  storyTitle: string;
  readingLevel: ReadingLevel;
  status: "in_progress" | "completed";
  score: number | null;
  correctAnswers: number | null;
  totalQuestions: number | null;
  pendingReview: number | null;
  startedAt: string;
  completedAt: string | null;
};

export type ProgressView = {
  mode: "demo" | "supabase";
  persistenceNote: string;
  preferredLevel: ReadingLevel | null;
  completedCount: number;
  sessions: ProgressSession[];
  storyStates: StoryState[];
  pending: ProgressSession | null;
  recommendation: string | null;
  supportNote: string | null;
  nextStory: StoryCard | null;
  geminiConfigured: boolean;
  skills: SkillProfileItem[];
  profileNote: string | null;
  mastery: SkillMastery[];
  levelNote: string | null;
};

export type TypeBreakdown = {
  id: string;
  type: QuestionType;
  skill: SkillId;
  label: string;
  correct: boolean;
  pendingReview: boolean;
};
