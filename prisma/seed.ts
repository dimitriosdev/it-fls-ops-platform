import "dotenv/config";
import { createAuthClient } from "@neon/auth";
import { BetterAuthVanillaAdapter } from "@neon/auth/vanilla/adapters";
import { UserRole } from "../src/generated/prisma/enums";
import { prisma } from "../src/lib/prisma";

async function seedInitialAdmin(): Promise<void> {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!baseUrl) {
    throw new Error("NEON_AUTH_BASE_URL must be set.");
  }

  if (!email) {
    throw new Error("ADMIN_EMAIL must be set.");
  }

  if (!password || password.length < 12 || password.length > 128) {
    throw new Error("ADMIN_PASSWORD must be between 12 and 128 characters.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { role: true, isActive: true },
  });

  if (existingUser) {
    if (existingUser.role !== UserRole.ADMIN || !existingUser.isActive) {
      throw new Error(
        "The configured admin email already belongs to a non-admin or inactive app user.",
      );
    }

    console.info("The initial admin profile already exists; no changes made.");
    return;
  }

  // Node does not send an Origin header, which Neon Auth requires.
  const origin = process.env.SEED_ORIGIN ?? "http://localhost:3000";
  const baseAdapter = BetterAuthVanillaAdapter();
  const authClient = createAuthClient(baseUrl, {
    adapter: (url, fetchOptions) =>
      baseAdapter(url, {
        ...fetchOptions,
        headers: { ...fetchOptions?.headers, Origin: origin },
      }),
  });
  const { error: signUpError } = await authClient.signUp.email({
    email,
    password,
    name: "Dimitrios",
  });

  if (signUpError) {
    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    if (signInError) {
      throw new Error(
        `Neon Managed Better Auth could not create or verify the initial admin: ${signUpError.message}`,
      );
    }
  }

  await prisma.user.create({
    data: {
      email,
      name: "Dimitrios",
      role: UserRole.ADMIN,
    },
  });

  console.info(`Created initial ADMIN user profile for ${email}.`);
}

async function main(): Promise<void> {
  try {
    await seedInitialAdmin();
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown error during admin seed.";
  console.error(`Initial admin seed failed: ${message}`);
  process.exitCode = 1;
});
