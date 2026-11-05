"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { UserRole } from "@/src/generated/prisma/enums";
import { requireAdmin } from "@/src/lib/auth/authorization";
import { neonAdmin } from "@/src/lib/auth/neon-admin";
import { prisma } from "@/src/lib/prisma";

export type ActionResult = { ok: true } | { ok: false; error: string };

const email = z.string().trim().toLowerCase().pipe(z.email());
const password = z.string().min(12).max(128);
const role = z.enum([UserRole.ADMIN, UserRole.SUPPORTER, UserRole.REPORTER]);
const userId = z.string().min(1);

const createUserSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email,
  password,
  role,
});
const changeRoleSchema = z.object({ userId, role });
const resetPasswordSchema = z.object({ userId, password });
const setActiveSchema = z.object({ userId, isActive: z.boolean() });

function fail(error: string): ActionResult {
  return { ok: false, error };
}

function countOtherActiveAdmins(excludeUserId: string) {
  return prisma.user.count({
    where: { role: UserRole.ADMIN, isActive: true, id: { not: excludeUserId } },
  });
}

async function findNeonUserId(userEmail: string): Promise<string | null> {
  const { data } = await neonAdmin.listUsers({
    query: {
      searchField: "email",
      searchOperator: "contains",
      searchValue: userEmail,
      limit: 10,
    },
  });
  return data?.users.find((u) => u.email.toLowerCase() === userEmail)?.id ?? null;
}

export async function createUser(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input.");
  const data = parsed.data;

  if (
    await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } })
  ) {
    return fail("A user with this email already exists.");
  }

  // Neon Auth stores credentials and hashes the password; the Prisma row holds role and profile.
  const { error } = await neonAdmin.createUser({
    email: data.email,
    password: data.password,
    name: data.name,
  });
  if (error) return fail("Could not create the login account.");

  await prisma.user.create({
    data: { email: data.email, name: data.name, role: data.role },
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function changeUserRole(input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = changeRoleSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input.");
  const { userId: id, role: newRole } = parsed.data;

  if (
    id === admin.id &&
    newRole !== UserRole.ADMIN &&
    (await countOtherActiveAdmins(id)) === 0
  ) {
    return fail("You cannot remove the last active admin.");
  }

  await prisma.user.update({ where: { id }, data: { role: newRole } });
  revalidatePath("/admin");
  return { ok: true };
}

export async function setUserActive(input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = setActiveSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input.");
  const { userId: id, isActive } = parsed.data;

  if (!isActive && id === admin.id) {
    return fail("You cannot disable your own account.");
  }

  const target = await prisma.user.update({
    where: { id },
    data: { isActive },
    select: { email: true },
  });

  // isActive already blocks login and getCurrentUser; banning also kills Neon sessions.
  const neonUserId = await findNeonUserId(target.email);
  if (neonUserId) {
    if (isActive) {
      await neonAdmin.unbanUser({ userId: neonUserId });
    } else {
      await neonAdmin.banUser({ userId: neonUserId });
      await neonAdmin.revokeUserSessions({ userId: neonUserId });
    }
  }

  revalidatePath("/admin");
  return { ok: true };
}

export async function resetUserPassword(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input.");

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { email: true },
  });
  if (!target) return fail("User not found.");

  const neonUserId = await findNeonUserId(target.email);
  if (!neonUserId) return fail("Login account not found.");

  const { error } = await neonAdmin.setUserPassword({
    userId: neonUserId,
    newPassword: parsed.data.password,
  });
  if (error) return fail("Could not reset the password.");

  await neonAdmin.revokeUserSessions({ userId: neonUserId });
  return { ok: true };
}
