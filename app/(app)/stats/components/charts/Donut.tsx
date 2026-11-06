import type { Item } from "../../aggregate";
import { INK, PALETTE, fmt } from "../../theme";

export function Donut({ data }: { data: Item[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = 60;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <svg viewBox="0 0 160 160" style={{ width: 160, height: 160 }}>
        <g transform="rotate(-90 80 80)">
          {data.map((d, i) => {
            const len = (d.value / total) * c;
            const el = (
              <circle
                key={d.label}
                cx={80}
                cy={80}
                r={r}
                fill="none"
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth={26}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </g>
        <text x={80} y={85} textAnchor="middle" fontSize={18} fontWeight={700} fill={INK}>
          {fmt(total)}
        </text>
      </svg>
      <div style={{ display: "grid", gap: 4, fontSize: 12 }}>
        {data.map((d, i) => (
          <span
            key={d.label}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, color: INK }}
          >
            <i
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: PALETTE[i % PALETTE.length],
              }}
            />
            {d.label}: {fmt(d.value)} ({Math.round((d.value / total) * 100)}%)
          </span>
        ))}
      </div>
    </div>
  );
}
