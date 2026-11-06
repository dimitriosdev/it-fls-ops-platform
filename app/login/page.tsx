import { redirect } from "next/navigation";
import { getCurrentUser } from "@/src/lib/auth/authorization";
import { getLang, pick } from "@/src/lib/i18n";
import { AuthShell } from "../AuthShell";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) {
    redirect("/dashboard");
  }
  const lang = await getLang();

  return (
    <AuthShell title="Hallo">
      <p>
        {pick(
          lang,
          "Melde dich mit deinem Mitarbeiterkonto an.",
          "Sign in with your employee account.",
        )}
      </p>
      <LoginForm lang={lang} />
    </AuthShell>
  );
}
