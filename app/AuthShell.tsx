import type { ReactNode } from "react";
import logoMark from "../assets/images/logo-dg-erp-mark-only.0e1f217bc91f66520a3db5a640b33c5c.svg";
import "./auth.css";

export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  const logo = logoMark.src || String(logoMark);
  return (
    <div className="auth-page">
      <div className="topline" />
      <div className="auth-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" width={22} height={26} />
        <span>IT FLS</span>
      </div>
      <main className="auth-wrap">
        <section className="auth-card">
          <h1>👋 {title}</h1>
          {children}
        </section>
        <div className="auth-card-shadow" />
      </main>
    </div>
  );
}
