"use client";

import { useEffect, useState } from "react";
import type { Lang } from "./i18n";

const STORAGE_KEY = "stats-lang";

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = useState<Lang>("de");
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "de" || saved === "en") setLang(saved);
  }, []);
  const change = (l: Lang) => {
    setLang(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  };
  return [lang, change];
}
