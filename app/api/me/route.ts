import { jsonData, jsonError } from "@/lib/api/http";
import { loadIdentity } from "@/lib/auth/identity";

export async function GET() {
  try {
    return jsonData(await loadIdentity());
  } catch (error) {
    return jsonError(error);
  }
}
