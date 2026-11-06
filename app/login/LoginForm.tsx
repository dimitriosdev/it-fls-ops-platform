"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

export function LoginForm({ lang }: { lang: "de" | "en" }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const t = (de: string, en: string) => (lang === "en" ? en : de);

  return (
    <form action={action}>
      <label>
        {t("E-Mail", "Email")}
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        {t("Passwort", "Password")}
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state.error ? (
        <p className="auth-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="auth-btn" type="submit" disabled={pending}>
        {pending
          ? t("Anmeldung …", "Signing in …")
          : t("Als Mitarbeiter anmelden", "Sign in as employee")}
      </button>
    </form>
  );
}
