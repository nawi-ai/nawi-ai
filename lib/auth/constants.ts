export const DEMO_COOKIE = "nawi_demo_reader";
export const FORCE_DEMO = "nawi_force_demo";
export const AUTH_ERROR = "nawi_auth_error";

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 400,
};
