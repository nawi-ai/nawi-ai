import "server-only";

export function supabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  return { url, anonKey };
}

export function isSupabaseAuthConfigured() {
  const { url, anonKey } = supabasePublicEnv();
  return url.startsWith("https://") && anonKey.length > 20;
}

export function isServiceRoleConfigured() {
  return (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim().length ?? 0) > 20;
}

export function isRemotePersistenceConfigured() {
  return isSupabaseAuthConfigured() && isServiceRoleConfigured();
}

export function geminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY?.trim() ?? "";
  const model = process.env.GEMINI_MODEL?.trim() ?? "";
  if (!apiKey || !model) return null;
  return { apiKey, model };
}

export function isGeminiConfigured() {
  return geminiConfig() !== null;
}
