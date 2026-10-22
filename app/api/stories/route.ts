import { jsonData, jsonError } from "@/lib/api/http";
import { listStoryCards } from "@/lib/stories/catalog";

export async function GET() {
  try {
    return jsonData({ stories: listStoryCards() });
  } catch (error) {
    return jsonError(error);
  }
}
