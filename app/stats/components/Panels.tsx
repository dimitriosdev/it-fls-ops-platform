import type { ReactNode } from "react";
import { INK, LINE, MUTED } from "../theme";

export function Card({
  title,
  children,
  wide,
}: {
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <section
      style={{
        background: "#fff",
        border: `1px solid ${LINE}`,
        borderRadius: 12,
        padding: 16,
        gridColumn: wide ? "1 / -1" : undefined,
        minWidth: 0,
      }}
    >
      <h3 style={{ margin: "0 0 12px", fontSize: 15, color: INK }}>{title}</h3>
      {children}
    </section>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 20, color: INK, margin: "0 0 12px" }}>{title}</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 16,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${LINE}`,
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div style={{ fontSize: 12, color: MUTED }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: INK }}>{value}</div>
    </div>
  );
}
