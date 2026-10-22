import { describe, expect, it } from "vitest";

import {
  findQuestion,
  getStory,
  listStories,
  listStoryCardsForLevel,
  publicPayloadIsSafe,
  toPublicQuestions,
  toReaderStory,
} from "@/lib/stories/catalog";

describe("catálogo público", () => {
  it("no envía criterios ni la clave al navegador", () => {
    const story = getStory("killa-montana-colores");
    expect(story).not.toBeNull();
    if (!story) return;
    const payload = {
      story: toReaderStory(story),
      questions: toPublicQuestions(story),
    };
    expect(publicPayloadIsSafe(payload)).toBe(true);
    expect(payload.questions.filter((question) => question.role === "core")).toHaveLength(3);
    expect(payload.questions.find((question) => question.format === "open")?.role).toBe("core");
    expect(payload.questions[0]).not.toHaveProperty("correctChoiceId");
    expect(payload.questions[0]).not.toHaveProperty("hint");
  });

  it("las pistas no copian la opción correcta", () => {
    for (const story of listStories()) {
      for (const question of story.questions) {
        const correct = question.choices?.find((choice) => choice.id === question.correctChoiceId);
        if (!correct) continue;
        expect(question.hint.toLowerCase().includes(correct.label.toLowerCase())).toBe(false);
        expect(question.hintStrong.toLowerCase().includes(correct.label.toLowerCase())).toBe(false);
      }
    }
  });

  it("un nivel solo incluye sus cuentos", () => {
    const stories = listStoryCardsForLevel(1);
    expect(stories.map((story) => story.id)).toEqual([
      "luna-jardin-estrellas",
      "nina-mate-caido",
      "lucho-cometa-parque",
    ]);
    expect(stories.every((story) => story.level === 1)).toBe(true);
    expect(listStoryCardsForLevel(2).map((story) => story.id)).toEqual([
      "tomi-rio-cancion",
      "maya-luciernagas-maizal",
      "sami-horno-callado",
    ]);
    expect(listStoryCardsForLevel(3).map((story) => story.id)).toEqual([
      "killa-montana-colores",
      "amaru-tambor-pueblo",
      "inti-historia-abuelo",
    ]);
  });

  it("no acepta una pregunta de otro cuento", () => {
    const story = getStory("luna-jardin-estrellas");
    expect(story).not.toBeNull();
    if (!story) return;
    expect(findQuestion(story, "tomi-q1")).toBeNull();
    expect(findQuestion(story, "luna-q1")?.format).toBe("choice");
  });
});
