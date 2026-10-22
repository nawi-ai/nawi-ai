import "server-only";

import { randomUUID } from "node:crypto";
import { io } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { AppError } from "@/lib/api/http";
import { AUTH_ERROR, cookieOptions, DEMO_COOKIE, FORCE_DEMO } from "@/lib/auth/constants";
import { isGeminiConfigured, isRemotePersistenceConfigured } from "@/lib/env.server";
import { createDemoRepository } from "@/lib/persistence/demo-store";
import { createSupabaseRepository } from "@/lib/persistence/supabase-store";
import type { SessionRepository } from "@/lib/persistence/types";
import type { ReadingLevel } from "@/lib/reading-level";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type Identity =
  | {
      kind: "reader";
      mode: "demo" | "supabase";
      readerId: string;
      preferredLevel: ReadingLevel | null;
      geminiConfigured: boolean;
      remoteConfigured: boolean;
      persistenceNote: string;
    }
  | {
      kind: "setup";
      message: string;
      geminiConfigured: boolean;
      remoteConfigured: boolean;
    };

export async function loadIdentity(): Promise<Identity> {
  // getUser() compara la caducidad del token con Date.now(). Durante el
  // prerender eso es un valor inestable; io() deja esa lectura para el request.
  await io();
  const jar = await cookies();
  const geminiConfigured = isGeminiConfigured();
  const remoteConfigured = isRemotePersistenceConfigured();
  const forceDemo = jar.get(FORCE_DEMO)?.value === "1";

  if (remoteConfigured && !forceDemo) {
    const authError = jar.get(AUTH_ERROR)?.value;
    if (authError === "anonymous_disabled") {
      return {
        kind: "setup",
        geminiConfigured,
        remoteConfigured,
        message:
          "Supabase está conectado, pero el acceso anónimo está apagado. En el panel de Supabase abre Authentication, Providers y activa Anonymous. También puedes continuar en una demostración local, que no guarda en la nube.",
      };
    }
    if (authError) {
      return {
        kind: "setup",
        geminiConfigured,
        remoteConfigured,
        message:
          "No pudimos abrir una sesión anónima en Supabase. Revisa la URL, la clave anónima y que el proveedor Anonymous esté activo.",
      };
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return {
        kind: "setup",
        geminiConfigured,
        remoteConfigured,
        message:
          "Todavía no hay una sesión de lector. Recarga la página. Si continúa igual, activa el acceso anónimo en Supabase.",
      };
    }

    const admin = createServiceClient();
    const repository = createSupabaseRepository(supabase, admin);
    const reader = await repository.ensureReader(data.user.id);
    return {
      kind: "reader",
      mode: "supabase",
      readerId: data.user.id,
      preferredLevel: reader.preferredLevel,
      geminiConfigured,
      remoteConfigured: true,
      persistenceNote:
        "Tus lecturas se guardan para la próxima vez que abras Ñawi en este navegador.",
    };
  }

  const readerId = jar.get(DEMO_COOKIE)?.value;
  if (!readerId || !z.string().uuid().safeParse(readerId).success) {
    return {
      kind: "setup",
      geminiConfigured,
      remoteConfigured,
      message: remoteConfigured
        ? "Puedes volver a intentar Supabase o preparar la demostración local."
        : "Estamos preparando un espacio de demostración en este servidor. Recarga la página si no aparece solo.",
    };
  }

  const reader = await createDemoRepository().ensureReader(readerId);
  const base = remoteConfigured
    ? "Estás en la demostración local. Estos datos no se guardan en Supabase."
    : "Modo demostración: tus lecturas se guardan en este servidor, no en la nube. Si se apaga el servidor, pueden perderse.";

  return {
    kind: "reader",
    mode: "demo",
    readerId,
    preferredLevel: reader.preferredLevel,
    geminiConfigured,
    remoteConfigured: false,
    persistenceNote: base,
  };
}

export async function requireReader() {
  const identity = await loadIdentity();
  if (identity.kind !== "reader") {
    throw new AppError(401, "setup_required", identity.message);
  }
  return identity;
}

export async function repositoryFor(mode: "demo" | "supabase"): Promise<SessionRepository> {
  if (mode === "demo") return createDemoRepository();
  const user = await createSupabaseServerClient();
  return createSupabaseRepository(user, createServiceClient());
}

export async function enableDemoMode() {
  const jar = await cookies();
  const current = jar.get(DEMO_COOKIE)?.value;
  const readerId =
    current && z.string().uuid().safeParse(current).success ? current : randomUUID();
  jar.set(FORCE_DEMO, "1", cookieOptions);
  jar.set(DEMO_COOKIE, readerId, cookieOptions);
  jar.set(AUTH_ERROR, "", { ...cookieOptions, maxAge: 0 });
  await createDemoRepository().ensureReader(readerId);
  return readerId;
}

export async function clearDemoOverride() {
  if (!isRemotePersistenceConfigured()) {
    throw new AppError(
      400,
      "remote_not_configured",
      "Supabase todavía no está configurado. Revisa .env.example.",
    );
  }
  const jar = await cookies();
  jar.set(FORCE_DEMO, "", { ...cookieOptions, maxAge: 0 });
}
