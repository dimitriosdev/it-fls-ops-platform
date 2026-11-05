"use client";

import { useT } from "../LangContext";
import { ACCENT, INK, LINE, MUTED, OTHER } from "../theme";

export function Filters({
  supporters,
  bounds,
  from,
  to,
  selected,
  onFrom,
  onTo,
  onSelected,
}: {
  supporters: string[];
  bounds: { min: string; max: string };
  from: string;
  to: string;
  selected: Set<string>;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onSelected: (s: Set<string>) => void;
}) {
  const t = useT();
  const toggle = (k: string) => {
    const next = new Set(selected);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    onSelected(next);
  };
  const input = {
    padding: 6,
    border: `1px solid ${LINE}`,
    borderRadius: 6,
    fontSize: 13,
  };
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${LINE}`,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        display: "grid",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          fontSize: 13,
          color: MUTED,
        }}
      >
        <label>
          {t.from}{" "}
          <input
            type="date"
            style={input}
            value={from}
            min={bounds.min}
            max={to || bounds.max}
            onChange={(e) => onFrom(e.target.value)}
          />
        </label>
        <label>
          {t.to}{" "}
          <input
            type="date"
            style={input}
            value={to}
            min={from || bounds.min}
            max={bounds.max}
            onChange={(e) => onTo(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            onFrom(bounds.min);
            onTo(bounds.max);
            onSelected(new Set([...supporters, OTHER]));
          }}
          style={{ ...input, background: "#f4f6f7", cursor: "pointer" }}
        >
          {t.reset}
        </button>
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          fontSize: 13,
        }}
      >
        <span style={{ color: MUTED }}>{t.resolvedBy}</span>
        {supporters.map((o) => {
          const on = selected.has(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(o)}
              style={{
                padding: "4px 12px",
                borderRadius: 999,
                border: `1px solid ${on ? ACCENT : LINE}`,
                background: on ? ACCENT : "#fff",
                color: on ? "#fff" : INK,
                cursor: "pointer",
              }}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
