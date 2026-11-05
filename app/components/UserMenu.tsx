"use client";

import { useEffect, useRef, useState } from "react";

type Theme = "light" | "dark" | "system";

interface Preferences {
  theme: Theme;
}

const defaultPreferences: Preferences = {
  theme: "light",
};

function translate(context: DemoContext, de: string, en: string): string {
  return context.lang === "en" ? en : de;
}

function applyPreferences(preferences: Preferences): void {
  const dark =
    preferences.theme === "dark" ||
    (preferences.theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("theme-dark", dark);
  document.body.classList.add("compact");
  document.body.classList.remove("hide-hint", "hide-bell");
}

export default function UserMenu(): React.JSX.Element {
  const [context, setContext] = useState<DemoContext>({
    lang: "de",
    currentRole: "supporter",
    currentUser: "",
    teamLeader: "",
  });
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateContext = () => {
      if (typeof window.getItSupportDemoContext === "function") {
        setContext(window.getItSupportDemoContext());
      }
    };

    updateContext();
    window.addEventListener("it-support-demo:context-change", updateContext);
    return () =>
      window.removeEventListener("it-support-demo:context-change", updateContext);
  }, []);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("it-demo-prefs") || "{}");
    setPreferences({ ...defaultPreferences, ...saved });
  }, []);

  useEffect(() => {
    if (preferences) applyPreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    if (!isOpen) return;

    function handleDocumentClick(event: MouseEvent): void {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!buttonRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const name =
    context.currentRole === "leader" ? context.teamLeader : context.currentUser;

  function setPreference<K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
  ): void {
    if (!preferences) return;
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    localStorage.setItem("it-demo-prefs", JSON.stringify(next));
    setIsOpen(false);
  }

  function toggleLanguage(language: DemoContext["lang"]): void {
    setIsOpen(false);
    if (context.lang !== language) window.toggleLanguage();
  }

  function info(label: string, value: string): React.JSX.Element {
    return (
      <div className="um-row" key={label}>
        <span>{label}</span>
        <span className="um-value">{value}</span>
      </div>
    );
  }

  function mode(key: Theme, icon: string, label: string): React.JSX.Element {
    return (
      <button
        className={`um-row um-mode ${preferences.theme === key ? "on" : ""}`}
        key={key}
        onClick={() => setPreference("theme", key)}
        type="button"
      >
        <span>
          <i>{icon}</i>
          {label}
        </span>
        {preferences.theme === key && <b>✓</b>}
      </button>
    );
  }

  return (
    <>
      <button
        className="avatar"
        id="currentAvatar"
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls="userMenu"
        aria-label={translate(context, "Benutzermenü", "User menu")}
        onClick={() => setIsOpen((open) => !open)}
        ref={buttonRef}
      >
        {name.charAt(0).toUpperCase() || "D"}
      </button>
      <div className="usermenu" id="userMenu" hidden={!isOpen} ref={menuRef}>
        {preferences && (
          <>
            <div className="um-group">
              {info(translate(context, "Mein Konto", "My account"), name)}
              <label className="um-row">
                <span>{translate(context, "Rolle", "Role")}</span>
                <select
                  id="rolePicker"
                  className="um-select"
                  value={context.currentRole}
                  onChange={(event) => {
                    setIsOpen(false);
                    window.changeRole(event.target.value);
                  }}
                >
                  <option value="supporter">Supporter</option>
                  <option value="reporter">Reporter</option>
                  <option value="leader">Team leader</option>
                </select>
              </label>
              {info(translate(context, "Standort", "Location"), "Hauptlager Wohlen")}
            </div>
            <div className="um-group">
              <div className="um-label">{translate(context, "Sprache", "Language")}</div>
              <button
                className={`um-row um-mode ${context.lang === "de" ? "on" : ""}`}
                onClick={() => toggleLanguage("de")}
                type="button"
              >
                <span>
                  <i>DE</i>Deutsch
                </span>
                {context.lang === "de" && <b>✓</b>}
              </button>
              <button
                className={`um-row um-mode ${context.lang === "en" ? "on" : ""}`}
                onClick={() => toggleLanguage("en")}
                type="button"
              >
                <span>
                  <i>EN</i>English
                </span>
                {context.lang === "en" && <b>✓</b>}
              </button>
            </div>
            <div className="um-group">
              <div className="um-label">
                {translate(context, "Anzeigemodus", "Display mode")}
              </div>
              {mode("light", "☀", translate(context, "Hell", "Light"))}
              {mode("dark", "☾", translate(context, "Dunkel", "Dark"))}
              {mode("system", "◐", "System")}
            </div>
            <div className="um-group">
              <button
                className="um-row um-mode"
                onClick={() => {
                  setIsOpen(false);
                  window.resetDemo();
                }}
                type="button"
              >
                <span>
                  {translate(context, "Demo-Daten zurücksetzen", "Reset demo data")}
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
