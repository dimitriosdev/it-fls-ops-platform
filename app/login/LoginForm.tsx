"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={action} style={{ display: "grid", gap: 12, width: 320 }}>
      <label>
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          style={{ width: "100%" }}
        />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          style={{ width: "100%" }}
        />
      </label>
      {state.error ? <p role="alert">{state.error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Login"}
      </button>
    </form>
  );
}
