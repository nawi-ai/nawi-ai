import { jsonData, jsonError, readJson } from "@/lib/api/http";
import { createReadingSession } from "@/lib/sessions/service";

export async function POST(request: Request) {
  try {
    const session = await createReadingSession(await readJson(request));
    return jsonData({ session }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
