import { jsonData, jsonError } from "@/lib/api/http";
import { completeReading } from "@/lib/sessions/service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;
    const session = await completeReading(sessionId);
    return jsonData({ session });
  } catch (error) {
    return jsonError(error);
  }
}
