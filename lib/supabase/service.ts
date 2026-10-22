import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { AppError } from "@/lib/api/http";
import { isServiceRoleConfigured, supabasePublicEnv } from "@/lib/env.server";

export function createServiceClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!isServiceRoleConfigured() || !key) {
    throw new AppError(
      503,
      "service_role_missing",
      "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor para guardar lecturas sin permitir que el navegador cambie el puntaje.",
    );
  }

  const { url } = supabasePublicEnv();
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
