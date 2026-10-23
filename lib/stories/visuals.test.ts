import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { STORY_VISUALS } from "@/data/story-visuals";
import { listStories } from "@/lib/stories/catalog";

describe("story visuals", () => {
  it("includes a cover and one illustration for every reading page", () => {
    for (const story of listStories()) {
      const visual = STORY_VISUALS[story.id];
      expect(visual).toBeDefined();
      expect(visual.sceneAlts).toHaveLength(story.pageStarts.length);
      expect(existsSync(join(process.cwd(), "public", "stories", story.id, "cover.webp"))).toBe(true);

      for (let page = 1; page <= story.pageStarts.length; page += 1) {
        const name = `scene-${String(page).padStart(2, "0")}.webp`;
        expect(existsSync(join(process.cwd(), "public", "stories", story.id, name))).toBe(true);
      }
    }
  });
});
