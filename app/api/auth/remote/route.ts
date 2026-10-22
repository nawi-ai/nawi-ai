import { jsonData, jsonError } from "@/lib/api/http";
import { clearDemoOverride } from "@/lib/auth/identity";

export async function POST() {
  try {
    await clearDemoOverride();
    return jsonData({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}