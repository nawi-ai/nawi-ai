import "server-only";

import { STORIES, type Story, type StoryQuestion } from "@/data/stories";

export type { StoryQuestion };
import type { ReadingLevel } from "@/lib/reading-level";
import type { PublicQuestion, ReaderStory, StoryCard } from "@/lib/stories/public";

export type { PublicQuestion, ReaderStory, StoryCard };

const SECRET_KEYS = ["criteria", "correctChoiceId", "explanation", "hint", "hintStrong"] as const;

export function listStories() {
  return STORIES;
}

export function listStoryCards(): StoryCard[] {
  return STORIES.map(toStoryCard);
}

export function listStoryCardsForLevel(level: ReadingLevel): StoryCard[] {
  return listStoryCards().filter((story) => story.level === level);
}

export function getStory(storyId: string): Story | null {
  return STORIES.find((story) => story.id === storyId) ?? null;
}

export function getStoryCard(storyId: string): StoryCard | null {
  const story = getStory(storyId);
  return story ? toStoryCard(story) : null;
}

export function toReaderStory(story: Story): ReaderStory {
  return {
    ...toStoryCard(story),
    paragraphs: story.paragraphs,
    pageStarts: story.pageStarts,
  };
}

export function toPublicQuestions(story: Story): PublicQuestion[] {
  return story.questions.map((question) => ({
    id: question.id,
    type: question.type,
    skill: question.skill,
    role: question.role,
    supportsQuestionId: question.supportsQuestionId,
    prompt: question.prompt,
    format: question.format,
    choices: question.choices?.map((choice) => ({ id: choice.id, label: choice.label })),
  }));
}

export function findQuestion(story: Story, questionId: string): StoryQuestion | null {
  return story.questions.find((question) => question.id === questionId) ?? null;
}

export function storyText(story: Story) {
  return story.paragraphs.join("\n\n").slice(0, 6000);
}

export function publicPayloadIsSafe(value: unknown) {
  const serialized = JSON.stringify(value);
  return SECRET_KEYS.every((key) => !serialized.includes(`"${key}"`));
}

function toStoryCard(story: Story): StoryCard {
  return {
    id: story.id,
    title: story.title,
    summary: story.summary,
    level: story.level,
    minutes: story.minutes,
    skills: story.skills,
  };
}
