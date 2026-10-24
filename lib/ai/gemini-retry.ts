export function geminiStatus(error: unknown) {
  if (!error || typeof error !== "object" || !("status" in error)) return null;
  const status = error.status;
  return typeof status === "number" && Number.isInteger(status) ? status : null;
}

export function isRetryableGeminiError(error: unknown, attempt: number) {
  if (attempt >= 1) return false;
  const status = geminiStatus(error);
  const message = error instanceof Error ? error.message : "";
  if (
    isQuotaFailure(status, message) ||
    isClientFailure(status) ||
    isAbortFailure(message) ||
    isBusyFailure(status, message)
  ) {
    return false;
  }
  if (status === 408 || status === 500 || status === 502) return true;
  return /fetch failed|ECONNRESET|ETIMEDOUT/i.test(message);
}

export function isQuotaFailure(status: number | null, message: string) {
  return status === 402 || status === 429 || /429|RESOURCE_EXHAUSTED|quota/i.test(message);
}

export function isAbortFailure(message: string) {
  return /timeout|aborted|AbortError|DEADLINE_EXCEEDED/i.test(message);
}

export function isBusyFailure(status: number | null, message: string) {
  return status === 503 || status === 504 || /UNAVAILABLE|high demand/i.test(message);
}

function isClientFailure(status: number | null) {
  return status !== null && status >= 400 && status < 500 && status !== 408 && status !== 429;
}
