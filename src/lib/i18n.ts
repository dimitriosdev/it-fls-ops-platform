import "server-only";

import { cookies } from "next/headers";

export type Lang = "de" | "en";

export async function getLang(): Promise<Lang> {
  const value = (await cookies()).get("lang")?.value;
  return value === "en" ? "en" : "de";
}

export const pick = (lang: Lang, de: string, en: string) => (lang === "en" ? en : de);
