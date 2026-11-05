import type { Item } from "../../aggregate";
import { MUTED, PALETTE, fmt } from "../../theme";

export function LineChart({ data }: { data: Item[] }) {
  const W = 500;
  const H = 180;
  const max = Math.max(1, ...data.map((d) => d.value));
  const pts = data.map(
    (d, i) =>
      `${(i / Math.max(1, data.length - 1)) * W},${H - (d.value / max) * (H - 10)}`,
  );
  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: "100%" }}>
      <polyline
        points={`0,${H} ${pts.join(" ")} ${W},${H}`}
        fill="#3195ee22"
        stroke="none"
      />
      <polyline points={pts.join(" ")} fill="none" stroke={PALETTE[1]} strokeWidth={2} />
      <text x={0} y={H + 14} fontSize={10} fill={MUTED}>
        {data[0]?.label}
      </text>
      <text x={W} y={H + 14} fontSize={10} fill={MUTED} textAnchor="end">
        {data[data.length - 1]?.label} · {fmt(max)}
      </text>
    </svg>
  );
}
