"use client";

import type { FormEvent } from "react";
import type { Lang } from "../i18n";
import { DICT } from "../i18n";
import { ACCENT, INK, LINE, MUTED } from "../theme";
import { LangToggle } from "./LangToggle";

export function PinGate({
  lang,
  onLang,
  pin,
  onPin,
  error,
  loading,
  onSubmit,
}: {
  lang: Lang;
  onLang: (l: Lang) => void;
  pin: string;
  onPin: (v: string) => void;
  error: "wrongPin" | "loadError" | "";
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
}) {
  const t = DICT[lang];
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f4f6f7",
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          background: "#fff",
          padding: 32,
          borderRadius: 12,
          border: `1px solid ${LINE}`,
          display: "grid",
          gap: 12,
          width: 300,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 20, color: INK }}>{t.statistics}</h1>
          <LangToggle lang={lang} onChange={onLang} />
        </div>
        <label style={{ fontSize: 13, color: MUTED }} htmlFor="pin">
          {t.enterPin}
        </label>
        <input
          id="pin"
          type="password"
          autoFocus
          autoComplete="off"
          value={pin}
          onChange={(e) => onPin(e.target.value)}
          style={{
            padding: 10,
            border: `1px solid ${LINE}`,
            borderRadius: 8,
            fontSize: 16,
          }}
        />
        {error && (
          <div role="alert" style={{ color: "#d92d20", fontSize: 13 }}>
            {error === "wrongPin" ? t.wrongPin : t.loadError}
          </div>
        )}
        <button
          type="submit"
          disabled={loading || !pin}
          style={{
            padding: 10,
            border: 0,
            borderRadius: 8,
            background: ACCENT,
            color: "#fff",
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          {loading ? t.checking : t.unlock}
        </button>
      </form>
    </main>
  );
}
