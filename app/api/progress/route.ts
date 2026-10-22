import { jsonData, jsonError } from "@/lib/api/http";
import { getProgress } from "@/lib/sessions/service";

export async function GET() {
  try {
    return jsonData(await getProgress());
  } catch (error) {
    return jsonError(error);
  }
}
