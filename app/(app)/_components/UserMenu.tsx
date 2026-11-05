"use client";

import { useEffect, useRef, useState } from "react";
import { logoutAction } from "../../login/actions";
import { setLanguage } from "../actions";

type Theme = "light" | "dark" | "system";

interface Props {
  name: string;
  email: string;
  roleLabel: string;
  lang: "de" | "en";
}

function applyTheme(theme: Theme): void {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("theme-dark", dark);
  document.body.classList.add("compact");
}

export default function UserMenu({
  name,
  email,
  roleLabel,
  lang,
}: Props): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const ref = useRef<HTMLDivElement>(null);
  const t = (de: string, en: string) => (lang === "en" ? en : de);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("it-demo-prefs") || "{}") as {
      theme?: Theme;
    };
    const initial = saved.theme ?? "light";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (e.target instanceof Node && !ref.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function chooseTheme(next: Theme): void {
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("it-demo-prefs", JSON.stringify({ theme: next }));
    setOpen(false);
  }

  const modeButton = (key: Theme, icon: string, label: string) => (
    <button
      className={`um-row um-mode ${theme === key ? "on" : ""}`}
      type="button"
      onClick={() => chooseTheme(key)}
    >
      <span>
        <i>{icon}</i>
        {label}
      </span>
      {theme === key && <b>✓</b>}
    </button>
  );

  const langButton = (key: "de" | "en", flag: string, label: string) => (
    <button
      className={`um-row um-mode ${lang === key ? "on" : ""}`}
      type="button"
      onClick={async () => {
        setOpen(false);
        if (lang !== key) await setLanguage(key);
      }}
    >
      <span>
        <i>{flag}</i>
        {label}
      </span>
      {lang === key && <b>✓</b>}
    </button>
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="avatar"
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t("Benutzermenü", "User menu")}
        onClick={() => setOpen((v) => !v)}
      >
        {name.charAt(0).toUpperCase() || "?"}
      </button>
      <div className="usermenu" hidden={!open}>
        <div className="um-group">
          <div className="um-row">
            <span>{t("Mein Konto", "My account")}</span>
            <span className="um-value">{name}</span>
          </div>
          <div className="um-row">
            <span>Email</span>
            <span className="um-value">{email}</span>
          </div>
          <div className="um-row">
            <span>{t("Rolle", "Role")}</span>
            <span className="um-value">{roleLabel}</span>
          </div>
        </div>
        <div className="um-group">
          <div className="um-label">{t("Sprache", "Language")}</div>
          {langButton("de", "DE", "Deutsch")}
          {langButton("en", "EN", "English")}
        </div>
        <div className="um-group">
          <div className="um-label">{t("Anzeigemodus", "Display mode")}</div>
          {modeButton("light", "☀", t("Hell", "Light"))}
          {modeButton("dark", "☾", t("Dunkel", "Dark"))}
          {modeButton("system", "◐", "System")}
        </div>
        <div className="um-group">
          <form action={logoutAction}>
            <button className="um-row um-mode" type="submit">
              <span>{t("Abmelden", "Sign out")}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
