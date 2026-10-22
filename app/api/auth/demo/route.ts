import { jsonData, jsonError } from "@/lib/api/http";
import { enableDemoMode } from "@/lib/auth/identity";

export async function POST() {
  try {
    const readerId = await enableDemoMode();
    return jsonData({ readerId, mode: "demo" as const });
  } catch (error) {
    return jsonError(error);
  }
}
