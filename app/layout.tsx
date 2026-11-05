import "../assets/css/styles.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "IT FLS Operations Platform",
  description: "Browser-based IT support tickets management application.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
