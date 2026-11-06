import { getLang, pick } from "@/src/lib/i18n";
import { AuthShell } from "../AuthShell";
import { logoutAction } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function LogoutPage() {
  const lang = await getLang();
  return (
    <AuthShell title={pick(lang, "Tschüss", "Goodbye")}>
      <p>{pick(lang, "Möchtest du dich abmelden?", "Do you want to sign out?")}</p>
      <form action={logoutAction}>
        <button className="auth-btn" type="submit">
          {pick(lang, "Abmelden", "Sign out")}
        </button>
      </form>
    </AuthShell>
  );
}
