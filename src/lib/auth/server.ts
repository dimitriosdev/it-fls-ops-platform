import { createNeonAuth } from "@neon/auth/next/server";

const baseUrl = process.env.NEON_AUTH_BASE_URL;
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

if (!baseUrl) {
  throw new Error("NEON_AUTH_BASE_URL must be set.");
}

if (!cookieSecret || cookieSecret.length < 32) {
  throw new Error(
    "NEON_AUTH_COOKIE_SECRET must be a cryptographically random value of at least 32 characters.",
  );
}

export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret: cookieSecret,
    sameSite: "lax",
  },
});
