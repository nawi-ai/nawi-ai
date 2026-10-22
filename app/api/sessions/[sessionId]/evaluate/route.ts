import { jsonData, jsonError, readJson } from "@/lib/api/http";
import { evaluateAttempt } from "@/lib/sessions/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;
    const answer = await evaluateAttempt(sessionId, await readJson(request));
    return jsonData({ answer });
  } catch (error) {
    return jsonError(error);
  }
}
