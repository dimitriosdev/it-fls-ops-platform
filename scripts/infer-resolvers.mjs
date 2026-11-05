// Fills remaining tickets without resolvedby/resolvedat using the nearest supporter-resolved ticket
// (previous or next by creation time) and the average resolution time of the same problem category.
// Writes a new file; the source is never modified.
// Usage: node scripts/infer-resolvers.mjs <source.json> <output.json>
import { readFileSync, writeFileSync } from "node:fs";

const [src, out] = process.argv.slice(2);
if (!src || !out) {
  console.error("Usage: node scripts/infer-resolvers.mjs <source.json> <output.json>");
  process.exit(1);
}

const SUPPORTERS = ["Markus Riedmüller", "Hans-Rudolf Schneebeli", "Naumce Taseski", "Asim Redzepi", "Dimitrios Metozis"];
const CATEGORY_MAP = {
  pc: "computer",
  computer: "computer",
  drucker: "printer",
  printer: "printer",
  bildschirm: "display",
  display: "display",
  scanner: "scanner",
  internet: "network",
  network: "network",
  eingabegeräte: "input",
  input: "input",
  software: "software",
};

const tickets = JSON.parse(readFileSync(src, "utf8"));
const time = (t) => new Date(t.created).getTime();
const categoryOf = (t) => {
  const raw = t.supportResolution?.estimation?.deviceCategory || t.device?.find((d) => d.category)?.category;
  if (!raw) return "other";
  return CATEGORY_MAP[raw.toLowerCase()] || "other";
};

// Average of recorded (positive) resolution minutes per category, from supporter-resolved tickets.
const sums = new Map();
let allSum = 0;
let allCount = 0;
for (const t of tickets) {
  const v = Number(t.supportResolution?.timeSpent?.value);
  if (SUPPORTERS.includes(t.resolvedby) && v > 0 && !t.supportResolution?.estimation?.timeSpent) {
    const k = categoryOf(t);
    const s = sums.get(k) || { sum: 0, n: 0 };
    s.sum += v;
    s.n++;
    sums.set(k, s);
    allSum += v;
    allCount++;
  }
}
const avgFor = (k) => {
  const s = sums.get(k);
  return s && s.n >= 5 ? s.sum / s.n : allSum / allCount;
};

const anchors = tickets
  .filter((t) => SUPPORTERS.includes(t.resolvedby))
  .map((t) => ({ at: time(t), by: t.resolvedby }))
  .sort((a, b) => a.at - b.at);

let filled = 0;
for (const t of tickets) {
  if (t.resolvedby || t.resolvedat) continue;
  const c = time(t);
  let prev = null;
  let next = null;
  for (const a of anchors) {
    if (a.at <= c) prev = a;
    else {
      next = a;
      break;
    }
  }
  const nearest = !next || (prev && c - prev.at <= next.at - c) ? prev : next;
  if (!nearest) continue;

  const category = categoryOf(t);
  const minutes = Math.max(1, Math.round(avgFor(category)));
  t.resolvedby = nearest.by;
  t.resolvedat = new Date(c + minutes * 60000).toISOString();
  if (!(Number(t.supportResolution?.timeSpent?.value) > 0)) {
    t.supportResolution = t.supportResolution || {};
    t.supportResolution.timeSpent = { value: minutes, unit: "minutes" };
  }
  t.resolutionInferred = {
    resolvedby: true,
    resolvedat: true,
    basis: `Nearest ${nearest.at <= c ? "previous" : "next"} supporter-resolved ticket (${Math.round(Math.abs(nearest.at - c) / 60000)} min away); resolvedat = created + ${minutes} min (average for category "${category}").`,
  };
  filled++;
}

writeFileSync(out, JSON.stringify(tickets, null, 2));
const stillNull = tickets.filter((t) => !t.resolvedby && !t.resolvedat).length;
console.log({ total: tickets.length, filled, stillNull });
console.log(Object.fromEntries([...sums].map(([k, s]) => [k, +(s.sum / s.n).toFixed(2)])));
