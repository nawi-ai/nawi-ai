import "server-only";

import { ZodError } from "zod";

export type LoadResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "setup" }
  | { ok: false; reason: "missing" }
  | { ok: false; reason: "error"; message: string };

export async function settle<T>(run: () => Promise<T>, fallback: string): Promise<LoadResult<T>> {
  try {
    return { ok: true, data: await run() };
  } catch (error) {
    if (isFrameworkControl(error) || !(error instanceof AppError)) throw error;
    if (isSetupError(error)) return { ok: false, reason: "setup" };
    if (error.status === 404) return { ok: false, reason: "missing" };
    return { ok: false, reason: "error", message: error.message || fallback };
  }
}

export function isSetupError(error: unknown) {
  return error instanceof AppError && error.code === "setup_required";
}

export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new AppError(400, "invalid_json", "No pudimos leer lo que enviaste.");
  }
}

export function jsonData<T>(data: T, status = 200) {
  return Response.json({ data }, { status });
}

export function jsonError(error: unknown) {
  if (isFrameworkControl(error)) throw error;

  if (error instanceof ZodError) {
    return Response.json(
      {
        error: {
          code: "invalid_input",
          message: "Revisa lo que enviaste e inténtalo otra vez.",
        },
      },
      { status: 400 },
    );
  }

  if (error instanceof AppError) {
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  console.error("nawi_unexpected", scrub(error));
  return Response.json(
    {
      error: {
        code: "unexpected",
        message: "Ocurrió un problema. Puedes intentarlo otra vez.",
      },
    },
    { status: 500 },
  );
}

function isFrameworkControl(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes("During prerendering") ||
      error.message.includes("NEXT_HTTP_ERROR_FALLBACK") ||
      error.message.includes("NEXT_REDIRECT"))
  );
}

function scrub(error: unknown) {
  const message = error instanceof Error ? error.message : "unknown";
  const secrets = [
    process.env.GEMINI_API_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ].filter((value): value is string => Boolean(value));

  let clean = message;
  for (const secret of secrets) {
    clean = clean.split(secret).join("[redacted]");
  }
  return clean.slice(0, 300);
}
