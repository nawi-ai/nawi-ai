export function isRetryableGeminiError(error: unknown, attempt: number) {
  if (attempt >= 1) return false;
  const message = error instanceof Error ? error.message : "";
  if (/429|RESOURCE_EXHAUSTED|quota/i.test(message)) return false;
  return /503|504|UNAVAILABLE|fetch failed|ECONNRESET|ETIMEDOUT/i.test(message);
}
