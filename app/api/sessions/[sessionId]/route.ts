import { jsonData, jsonError } from "@/lib/api/http";
import { getSessionDetail } from "@/lib/sessions/service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;
    return jsonData(await getSessionDetail(sessionId));
  } catch (error) {
    return jsonError(error);
  }
}
