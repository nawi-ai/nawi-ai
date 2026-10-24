export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    if (init?.signal?.aborted) {
      throw new ApiClientError(
        "La evaluación tardó demasiado. Puedes intentarlo otra vez.",
        0,
        "timeout",
      );
    }
    throw new ApiClientError(
      "No hay conexión. Revisa tu internet e inténtalo otra vez.",
      0,
      "offline",
    );
  }

  const body = (await response.json().catch(() => null)) as {
    data?: T;
    error?: { code?: string; message?: string };
  } | null;

  if (!response.ok || !body || body.error) {
    throw new ApiClientError(
      body?.error?.message ?? "No pudimos completar la acción.",
      response.status,
      body?.error?.code ?? "request_failed",
    );
  }

  return body.data as T;
}
