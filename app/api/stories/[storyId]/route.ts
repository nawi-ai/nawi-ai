import { AppError, jsonData, jsonError } from "@/lib/api/http";
import { getStory, toPublicQuestions, toReaderStory } from "@/lib/stories/catalog";

export async function GET(_request: Request, context: { params: Promise<{ storyId: string }> }) {
  try {
    const { storyId } = await context.params;
    const story = getStory(storyId);
    if (!story) {
      throw new AppError(404, "story_not_found", "No encontramos ese cuento.");
    }
    return jsonData({
      story: toReaderStory(story),
      questions: toPublicQuestions(story),
    });
  } catch (error) {
    return jsonError(error);
  }
}
