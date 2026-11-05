import "../assets/css/styles.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "IT Support | Incident Demo",
  description: "Browser-based IT support incident management demo.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
