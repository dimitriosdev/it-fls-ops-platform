"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/src/lib/auth/authorization";
import { prisma } from "@/src/lib/prisma";
import {
  changeUserRole,
  createUser,
  resetUserPassword,
  setUserActive,
  type ActionResult,
} from "@/src/server/users";

function finish(result: ActionResult): never {
  revalidatePath("/admin");
  redirect(
    result.ok ? "/admin?ok=1" : `/admin?error=${encodeURIComponent(result.error)}`,
  );
}

export async function createUserAction(formData: FormData): Promise<void> {
  finish(
    await createUser({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
    }),
  );
}

export async function changeRoleAction(formData: FormData): Promise<void> {
  finish(
    await changeUserRole({ userId: formData.get("userId"), role: formData.get("role") }),
  );
}

export async function setActiveAction(formData: FormData): Promise<void> {
  finish(
    await setUserActive({
      userId: formData.get("userId"),
      isActive: formData.get("isActive") === "true",
    }),
  );
}

export async function resetPasswordAction(formData: FormData): Promise<void> {
  finish(
    await resetUserPassword({
      userId: formData.get("userId"),
      password: formData.get("password"),
    }),
  );
}

const nameSchema = z.string().trim().min(1).max(80);

export async function addLookupAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const name = nameSchema.safeParse(formData.get("name"));
  if (!name.success) finish({ ok: false, error: "Invalid name." });
  const data = { name: name.data! };
  if (formData.get("kind") === "workplace") {
    await prisma.workplace.upsert({
      where: { name: data.name },
      update: { isActive: true },
      create: data,
    });
  } else {
    await prisma.category.upsert({
      where: { name: data.name },
      update: { isActive: true },
      create: data,
    });
  }
  finish({ ok: true });
}
