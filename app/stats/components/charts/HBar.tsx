import type { Item } from "../../aggregate";
import { INK, MUTED, PALETTE, fmt } from "../../theme";

export function HBar({
  data,
  color = PALETTE[1],
  unit = "",
}: {
  data: Item[];
  color?: string;
  unit?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ display: "grid", gap: 6 }}>
      {data.map((d) => (
        <div
          key={d.label}
          style={{
            display: "grid",
            gridTemplateColumns: "130px 1fr 56px",
            gap: 8,
            alignItems: "center",
            fontSize: 12,
          }}
        >
          <span
            style={{
              color: INK,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={d.label}
          >
            {d.label}
          </span>
          <div style={{ background: "#eef2f4", borderRadius: 4, height: 14 }}>
            <div
              style={{
                width: `${(d.value / max) * 100}%`,
                background: color,
                height: "100%",
                borderRadius: 4,
              }}
            />
          </div>
          <span style={{ color: MUTED, textAlign: "right" }}>
            {fmt(d.value)}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}
