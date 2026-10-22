import type { ReadingLevel } from "@/lib/reading-level";

export function pageCountForLevel(level: ReadingLevel) {
  if (level === 1) return 3;
  if (level === 2) return 6;
  return 9;
}

export function pagesFromStarts(paragraphs: string[], starts: readonly number[]) {
  return starts.map((start, index) => paragraphs.slice(start, starts[index + 1] ?? paragraphs.length));
}

export function pageOfParagraph(starts: readonly number[], paragraphIndex: number) {
  let page = 0;
  for (let index = 0; index < starts.length; index += 1) {
    if (paragraphIndex >= (starts[index] ?? 0)) page = index;
  }
  return page;
}
