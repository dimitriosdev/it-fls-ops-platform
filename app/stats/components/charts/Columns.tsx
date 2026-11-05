import type { Item } from "../../aggregate";
import { ACCENT, INK, MUTED, fmt } from "../../theme";

export function Columns({ data, color = ACCENT }: { data: Item[]; color?: string }) {
  const W = 500;
  const H = 200;
  const pad = 24;
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = (W - pad) / Math.max(1, data.length);
  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} style={{ width: "100%" }}>
      {data.map((d, i) => {
        const h = (d.value / max) * (H - 20);
        const x = pad + i * bw;
        return (
          <g key={d.label}>
            <rect x={x + 4} y={H - h} width={bw - 8} height={h} fill={color} rx={3} />
            <text
              x={x + bw / 2}
              y={H - h - 4}
              fontSize={10}
              textAnchor="middle"
              fill={INK}
            >
              {fmt(d.value)}
            </text>
            <text
              x={x + bw / 2}
              y={H + 14}
              fontSize={10}
              textAnchor="middle"
              fill={MUTED}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
