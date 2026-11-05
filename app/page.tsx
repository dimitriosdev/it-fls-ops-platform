"use client";

import { useEffect, useState } from "react";
import logoMark from "../assets/images/logo-dg-erp-mark-only.0e1f217bc91f66520a3db5a640b33c5c.svg";
import AppShell from "./components/AppShell";

const appScripts = [
  "/generated/js/data/reference-data.js",
  "/generated/js/data/seed-data.js",
  "/generated/js/leader.js",
  "/generated/js/app.js",
];

let appScriptsPromise: Promise<void> | null = null;

function loadAppScripts() {
  if (!appScriptsPromise) {
    appScriptsPromise = appScripts.reduce<Promise<void>>(
      (promise, src) =>
        promise.then(
          () =>
            new Promise<void>((resolve, reject) => {
              const script = document.createElement("script");
              script.src = src;
              script.onload = () => resolve();
              script.onerror = () =>
                reject(new Error(`Failed to load application script: ${src}`));
              document.body.appendChild(script);
            }),
        ),
      Promise.resolve(),
    );
  }

  return appScriptsPromise;
}

export default function HomePage(): React.JSX.Element {
  const [loadError, setLoadError] = useState<string>("");

  useEffect(() => {
    let active = true;

    loadAppScripts().catch((error) => {
      console.error(error);
      if (active) {
        setLoadError(
          "The demo could not start. Check that the compiled application assets are available and reload.",
        );
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <AppShell
        logoSrc={logoMark.src || logoMark}
        onHomeClick={() => window.setPage("dashboard")}
        onNotifications={() => window.showNotifications()}
      >
        <main className="content" id="view" />
      </AppShell>
      {loadError && <p className="notice">{loadError}</p>}
    </>
  );
}
