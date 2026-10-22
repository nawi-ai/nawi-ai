import { jsonData, jsonError, readJson } from "@/lib/api/http";
import { savePreferredLevel } from "@/lib/sessions/service";
import { profileSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const body = profileSchema.parse(await readJson(request));
    return jsonData(await savePreferredLevel(body.preferredLevel));
  } catch (error) {
    return jsonError(error);
  }
}
