import "server-only";

import { redirect } from "next/navigation";
import { UserRole } from "@/src/generated/prisma/enums";
import { auth } from "@/src/lib/auth/server";
import { prisma } from "@/src/lib/prisma";

type Role = (typeof UserRole)[keyof typeof UserRole];

export async function getCurrentUser() {
  const { data: session, error } = await auth.getSession();

  if (error) {
    throw error;
  }

  const email = session?.user.email.trim().toLowerCase();
  if (!email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  return user?.isActive ? user : null;
}

export async function hasRole(...roles: Role[]): Promise<boolean> {
  if (roles.length === 0) {
    return false;
  }

  const user = await getCurrentUser();
  return user !== null && roles.includes(user.role);
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  return user;
}

export async function requireSupporter() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPPORTER) {
    redirect("/dashboard");
  }

  return user;
}
