import { describe, expect, it } from "vitest";

import { listStories } from "@/lib/stories/catalog";
import { pageCountForLevel, pageOfParagraph, pagesFromStarts } from "@/lib/stories/pages";

describe("páginas del libro", () => {
  it("usa tres, seis o nueve páginas según el nivel", () => {
    for (const story of listStories()) {
      const pages = pagesFromStarts(story.paragraphs, story.pageStarts);
      expect(pages).toHaveLength(pageCountForLevel(story.level));
      expect(story.pageStarts[0]).toBe(0);
      expect(pages.every((page) => page.length > 0)).toBe(true);
      expect(pages.flat()).toEqual(story.paragraphs);
    }
  });

  it("sabe en qué página está la frase que se narra", () => {
    expect(pageOfParagraph([0, 4, 7], 0)).toBe(0);
    expect(pageOfParagraph([0, 4, 7], 4)).toBe(1);
    expect(pageOfParagraph([0, 4, 7], 9)).toBe(2);
  });
});
