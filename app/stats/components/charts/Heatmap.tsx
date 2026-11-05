import { ACCENT, MUTED } from "../../theme";

const HOUR_LABELS = Array.from({ length: 8 }, (_, i) => i * 3);

export function Heatmap({ days, data }: { days: string[]; data: number[][] }) {
  const max = Math.max(1, ...data.flat());
  const cw = 20;
  return (
    <svg
      viewBox={`0 0 ${40 + 24 * cw} ${days.length * cw + 20}`}
      style={{ width: "100%" }}
    >
      {days.map((d, y) => (
        <g key={d}>
          <text x={0} y={y * cw + 14} fontSize={10} fill={MUTED}>
            {d}
          </text>
          {data[y].map((v, x) => (
            <rect
              key={x}
              x={40 + x * cw}
              y={y * cw}
              width={cw - 2}
              height={cw - 2}
              rx={3}
              fill={ACCENT}
              opacity={v ? 0.12 + 0.88 * (v / max) : 0.04}
            >
              <title>{`${d} ${x}:00 — ${v}`}</title>
            </rect>
          ))}
        </g>
      ))}
      {HOUR_LABELS.map((h) => (
        <text
          key={h}
          x={40 + h * cw + 8}
          y={days.length * cw + 12}
          fontSize={9}
          fill={MUTED}
          textAnchor="middle"
        >
          {h}h
        </text>
      ))}
    </svg>
  );
}
