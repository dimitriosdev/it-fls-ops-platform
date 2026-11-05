export type Item = { label: string; value: number };

export type Ticket = {
  date: string;
  wd: number;
  hr: number;
  cats: string[];
  names: string[];
  dept: string | null;
  line: string | null;
  lean: string | null;
  role: string | null;
  from: string | null;
  sup: string | null;
  resolved: boolean;
  min: number;
  estCat: string | null;
  estimated: boolean;
  loc: string;
  match: string | null;
};

export type Payload = { generatedAt: string; supporters: string[]; tickets: Ticket[] };

export type Stats = {
  range: { from: string; to: string };
  kpis: { total: number; totalHours: number; avgPerDay: number };
  perMonth: Item[];
  cumulative: Item[];
  heatmap: { days: string[]; data: number[][] };
  deviceCategories: Item[];
  deviceNames: Item[];
  lines: Item[];
  departments: Item[];
  roles: Item[];
  reporters: Item[];
  resolvers: Item[];
  resolverAvgMinutes: Item[];
  histogram: Item[];
  medianByCategory: Item[];
  timeSource: Item[];
  locationStatus: Item[];
  matchStatus: Item[];
};

const inc = (m: Map<string, number>, k: string | null | undefined) => {
  if (k) m.set(k, (m.get(k) || 0) + 1);
};
const toList = (m: Map<string, number>, limit?: number): Item[] => {
  const arr = [...m.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  return limit ? arr.slice(0, limit) : arr;
};
const median = (a: number[]) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BUCKETS: [string, number, number][] = [
  ["0", 0, 0],
  ["1-2", 1, 2],
  ["3-5", 3, 5],
  ["6-10", 6, 10],
  ["11-20", 11, 20],
  ["21-60", 21, 60],
  [">60", 61, Infinity],
];

export function compute(tickets: Ticket[]): Stats {
  const perMonth = new Map<string, number>();
  const perDay = new Map<string, number>();
  const heat = Array.from({ length: 7 }, () => Array(24).fill(0));
  const devCat = new Map<string, number>();
  const devName = new Map<string, number>();
  const dept = new Map<string, number>();
  const line = new Map<string, number>();
  const role = new Map<string, number>();
  const reporters = new Map<string, number>();
  const resolvers = new Map<string, number>();
  const resolverMinutes = new Map<string, number[]>();
  const locStatus = new Map<string, number>();
  const matchStatus = new Map<string, number>();
  const timeSource = new Map<string, number>();
  const minutesByCat = new Map<string, number[]>();
  let totalMinutes = 0;

  for (const t of tickets) {
    const month = t.date.slice(0, 7);
    inc(perMonth, month);
    inc(perDay, t.date);
    if (t.wd >= 0) heat[t.wd][t.hr]++;
    for (const c of t.cats) inc(devCat, c);
    t.names.forEach((n) =>
      inc(
        devName,
        n === "Big Label Drucker" || n === "Small Label Drucker" ? "printer" : n,
      ),
    );
    inc(dept, t.dept);
    inc(line, t.line);
    inc(role, t.role);
    inc(reporters, t.from);
    inc(resolvers, t.sup);
    inc(locStatus, t.loc);
    inc(matchStatus, t.match);
    inc(timeSource, t.estimated ? "Estimated" : "Documented");
    if (t.min > 0) {
      totalMinutes += t.min;
      const key = t.estCat || "documented";
      if (!minutesByCat.has(key)) minutesByCat.set(key, []);
      minutesByCat.get(key)!.push(t.min);
      if (t.sup) {
        if (!resolverMinutes.has(t.sup)) resolverMinutes.set(t.sup, []);
        resolverMinutes.get(t.sup)!.push(t.min);
      }
    }
  }

  const months = [...perMonth.keys()].sort();
  const days = [...perDay.keys()].sort();
  let cum = 0;

  return {
    range: { from: days[0] || "", to: days[days.length - 1] || "" },
    kpis: {
      total: tickets.length,
      totalHours: Math.round(totalMinutes / 6) / 10,
      avgPerDay: days.length ? Math.round((tickets.length / days.length) * 10) / 10 : 0,
    },
    perMonth: months.map((m) => ({ label: m, value: perMonth.get(m)! })),
    cumulative: days.map((d) => ({ label: d, value: (cum += perDay.get(d)!) })),
    heatmap: { days: WEEKDAYS, data: heat },
    deviceCategories: toList(devCat),
    deviceNames: toList(devName, 10),
    lines: toList(line).sort((a, b) => a.label.localeCompare(b.label)),
    departments: toList(dept),
    roles: toList(role),
    reporters: toList(reporters, 10),
    resolvers: toList(resolvers),
    resolverAvgMinutes: [...resolverMinutes.entries()]
      .map(([label, v]) => ({ label, value: Math.round(avg(v) * 10) / 10 }))
      .sort((a, b) => b.value - a.value),
    histogram: BUCKETS.map(([label, lo, hi]) => ({
      label,
      value: tickets.filter((t) => t.min >= lo && t.min <= hi).length,
    })),
    medianByCategory: [...minutesByCat.entries()]
      .filter(([, v]) => v.length >= 10)
      .map(([label, v]) => ({ label, value: median(v) }))
      .sort((a, b) => b.value - a.value),
    timeSource: toList(timeSource),
    locationStatus: toList(locStatus),
    matchStatus: toList(matchStatus),
  };
}
