import "server-only";

import { AppError } from "@/lib/api/http";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_CALLS = 30;
const buckets = new Map<string, number[]>();

export function assertEvaluationRate(readerId: string) {
  const now = Date.now();
  const recent = (buckets.get(readerId) ?? []).filter((stamp) => now - stamp < WINDOW_MS);
  if (recent.length >= MAX_CALLS) {
    throw new AppError(
      429,
      "rate_limited",
      "Hicimos muchas evaluaciones seguidas. Espera un momento e inténtalo otra vez.",
    );
  }
  recent.push(now);
  buckets.set(readerId, recent);
}
