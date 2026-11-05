// Reassigns tickets resolved by non-supporters to the nearest supporter-resolved ticket (previous or next)
// and sets resolvedat to created + the average resolution time of the same problem category.
// Writes a new file; the source is never modified.
// Usage: node scripts/reassign-non-supporters.mjs <source.json> <output.json>
import { readFileSync, writeFileSync } from "node:fs";

const [src, out] = process.argv.slice(2);
if (!src || !out) {
  console.error("Usage: node scripts/reassign-non-supporters.mjs <source.json> <output.json>");
  process.exit(1);
}

const SUPPORTERS = ["Markus Riedmüller", "Hans-Rudolf Schneebeli", "Naumce Taseski", "Asim Redzepi", "Dimitrios Metozis"];
const MAP = {
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
  return (raw && MAP[raw.toLowerCase()]) || "other";
};

const sums = new Map();
let allSum = 0;
let allN = 0;
for (const t of tickets) {
  const v = Number(t.supportResolution?.timeSpent?.value);
  if (SUPPORTERS.includes(t.resolvedby) && v > 0 && !t.supportResolution?.estimation?.timeSpent) {
    const k = categoryOf(t);
    const s = sums.get(k) || { sum: 0, n: 0 };
    s.sum += v;
    s.n++;
    sums.set(k, s);
    allSum += v;
    allN++;
  }
}
const avgFor = (k) => (sums.get(k)?.n >= 5 ? sums.get(k).sum / sums.get(k).n : allSum / allN);

// Anchors are built before any change, so only original supporter-resolved tickets are used.
const anchors = tickets
  .filter((t) => SUPPORTERS.includes(t.resolvedby))
  .map((t) => ({ at: time(t), by: t.resolvedby }))
  .sort((a, b) => a.at - b.at);

let changed = 0;
for (const t of tickets) {
  if (!t.resolvedby || SUPPORTERS.includes(t.resolvedby)) continue;
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
  const n = !next || (prev && c - prev.at <= next.at - c) ? prev : next;
  if (!n) continue;

  const category = categoryOf(t);
  const minutes = Math.max(1, Math.round(avgFor(category)));
  const original = t.resolvedby;
  t.resolvedby = n.by;
  t.resolvedat = new Date(c + minutes * 60000).toISOString();
  if (!(Number(t.supportResolution?.timeSpent?.value) > 0)) {
    t.supportResolution = t.supportResolution || {};
    t.supportResolution.timeSpent = { value: minutes, unit: "minutes" };
  }
  t.resolutionInferred = {
    resolvedby: true,
    resolvedat: true,
    originalResolvedby: original,
    basis: `Resolver was not a supporter; reassigned to nearest ${n.at <= c ? "previous" : "next"} supporter-resolved ticket (${Math.round(Math.abs(n.at - c) / 60000)} min away); resolvedat = created + ${minutes} min (average for "${category}").`,
  };
  changed++;
}

writeFileSync(out, JSON.stringify(tickets, null, 2));
console.log({ total: tickets.length, changed });
