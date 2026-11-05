"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/src/lib/auth/server";
import { prisma } from "@/src/lib/prisma";

const schema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(128),
});

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const { email, password } = parsed.data;
  const profile = await prisma.user.findUnique({
    where: { email },
    select: { isActive: true },
  });
  if (!profile?.isActive) {
    return { error: "Invalid email or password." };
  }

  const { error } = await auth.signIn.email({ email, password });
  if (error) {
    return { error: "Invalid email or password." };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await auth.signOut();
  redirect("/login");
}
