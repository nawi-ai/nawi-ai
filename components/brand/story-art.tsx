import Image from "next/image";

import { STORY_VISUALS } from "@/data/story-visuals";

export function StoryArt({
  storyId,
  sceneIndex = 0,
  variant = "cover",
  className = "h-40 w-full",
  sizes = "(max-width: 760px) 42vw, 44vw",
  priority = false,
}: {
  storyId: string;
  sceneIndex?: number;
  variant?: "cover" | "scene";
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const visual = STORY_VISUALS[storyId] ?? STORY_VISUALS["luna-jardin-estrellas"];
  const safeScene = Math.min(Math.max(sceneIndex, 0), visual.sceneAlts.length - 1);
  const source = variant === "scene"
    ? `/stories/${storyId}/scene-${String(safeScene + 1).padStart(2, "0")}.webp`
    : `/stories/${storyId}/cover.webp`;
  const alt = variant === "scene" ? visual.sceneAlts[safeScene] : visual.coverAlt;

  return (
    <span className={`story-art ${className}`.trim()}>
      <Image
        src={source}
        alt={alt}
        fill
        sizes={sizes}
        quality={75}
        priority={priority}
        className="story-art__image"
      />
    </span>
  );
}
