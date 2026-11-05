// Converts the raw ticket export into a compact per-ticket data/stats.json used by /api/stats.
// Usage: node scripts/build-stats.mjs <path-to-export.json>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const src = process.argv[2] || process.env.STATS_SOURCE;
if (!src) {
  console.error("Usage: node scripts/build-stats.mjs <path-to-export.json>");
  process.exit(1);
}

// Only these people are IT supporters; other names in "resolvedby" are reporters answering colleagues.
const SUPPORTERS = ["Markus Riedmüller", "Hans-Rudolf Schneebeli", "Naumce Taseski", "Asim Redzepi", "Dimitrios Metozis"];

const tickets = JSON.parse(readFileSync(src, "utf8"));
const clean = (v) => (v === null || v === undefined || v === "undefined" || v === "null" || v === "" ? null : v);

const zurich = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Zurich",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  weekday: "short",
});
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const rows = tickets.map((t) => {
  const p = Object.fromEntries(zurich.formatToParts(new Date(t.created)).map((x) => [x.type, x.value]));
  const devices = Array.isArray(t.device) ? t.device : [];
  const cats = [...new Set(devices.map((d) => clean(d.category)).filter(Boolean))];
  const names = [...new Set(devices.map((d) => clean(d.name)).filter((n) => n && n !== "Unknown"))];
  const loc = t.location || {};
  const by = clean(t.resolvedby);
  const est = t.supportResolution?.estimation;
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    wd: weekdays.indexOf(p.weekday),
    hr: Number(p.hour),
    cats,
    names,
    dept: clean(loc.department),
    line: clean(loc.productionLine),
    lean: clean(loc.leanZone),
    role: clean(loc.role),
    from: clean(t.from),
    sup: by && SUPPORTERS.includes(by) ? by : null,
    resolved: !!t.resolvedat,
    min: Number(t.supportResolution?.timeSpent?.value) || 0,
    estCat: est?.deviceCategory || null,
    estimated: est?.timeSpent === true,
    loc: clean(loc.status) || "Unknown",
    match: clean(t.supportMatch?.status),
  };
});

mkdirSync("data", { recursive: true });
writeFileSync(
  "data/stats.json",
  JSON.stringify({ generatedAt: new Date().toISOString(), supporters: SUPPORTERS, tickets: rows }),
);
console.log(`Wrote data/stats.json for ${rows.length} tickets`);
