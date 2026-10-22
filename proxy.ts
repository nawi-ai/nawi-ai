import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { AUTH_ERROR, cookieOptions, DEMO_COOKIE, FORCE_DEMO } from "@/lib/auth/constants";

export async function proxy(request: NextRequest) {
  if (isPrefetch(request)) {
    return NextResponse.next();
  }

  if (!isRemoteConfigured() || request.cookies.get(FORCE_DEMO)?.value === "1") {
    return withDemoReader(request);
  }

  return withSupabaseSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

function withDemoReader(request: NextRequest) {
  const current = request.cookies.get(DEMO_COOKIE)?.value;
  const readerId = isUuid(current) ? current : crypto.randomUUID();
  if (!isUuid(current)) {
    request.cookies.set(DEMO_COOKIE, readerId);
  }
  const response = NextResponse.next({ request });
  if (!isUuid(current)) {
    response.cookies.set(DEMO_COOKIE, readerId, cookieOptions);
  }
  return response;
}

async function withSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    const signed = await supabase.auth.signInAnonymously();
    const code = signed.error
      ? /anonymous/i.test(signed.error.message)
        ? "anonymous_disabled"
        : "auth_failed"
      : "";
    response.cookies.set(AUTH_ERROR, code, code ? cookieOptions : { ...cookieOptions, maxAge: 0 });
  } else {
    response.cookies.set(AUTH_ERROR, "", { ...cookieOptions, maxAge: 0 });
  }

  return response;
}

function isRemoteConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  return url.startsWith("https://") && anonKey.length > 20 && serviceKey.length > 20;
}

function isPrefetch(request: NextRequest) {
  return (
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("purpose") === "prefetch" ||
    request.headers.has("next-router-segment-prefetch")
  );
}

function isUuid(value: string | undefined): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  );
}
