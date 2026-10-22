import type { QuestionRole, QuestionType, ReadingLevel, SkillId } from "@/lib/reading-level";

export type StoryCard = {
  id: string;
  title: string;
  summary: string;
  level: ReadingLevel;
  minutes: number;
  skills: string[];
};

export type ReaderStory = StoryCard & {
  paragraphs: string[];
  pageStarts: number[];
};

export type PublicQuestion = {
  id: string;
  type: QuestionType;
  skill: SkillId;
  role: QuestionRole;
  supportsQuestionId?: string;
  prompt: string;
  format: "choice" | "open";
  choices?: Array<{ id: string; label: string }>;
};
