// Creates a cleaned copy of the ticket export without touching the source file.
// Usage: node scripts/clean-tickets.mjs <source.json> <output.json>
import { readFileSync, writeFileSync } from "node:fs";

const [src, out] = process.argv.slice(2);
if (!src || !out) {
  console.error("Usage: node scripts/clean-tickets.mjs <source.json> <output.json>");
  process.exit(1);
}

const SUPPORTERS = ["Markus Riedmüller", "Hans-Rudolf Schneebeli", "Naumce Taseski", "Asim Redzepi", "Dimitrios Metozis"];
// Unresolved tickets from these reporters are dropped (unless a supporter can be inferred).
const DROP_REPORTERS = new Set([
  "Rukije Salmani", "Deniz Kaya", "Cagla Tastan", "Ralph Christopher Kneidinger", "Pascal Veraguth",
  "Erik Stofej", "Selim Keskin", "Ionela Abad", "Katarzyna Naczk", "Nasir Hakyar", "Daniela Stamenkova",
  "Emina Nakic", "Taras Diduk", "Sara Rizzo", "Judit Schwarz", "Rexhep Shoshaj", "Julian Thoma",
  "Onur Yilmazok", "Mara Raileanu", "Marius Laurentiu", "Suzana Pasic", "Rada Jevric",
]);
const DEFAULT_MINUTES = 3;

const tickets = JSON.parse(readFileSync(src, "utf8"));
const hourKey = (t) => t.created.slice(0, 13);

const byHour = new Map();
for (const t of tickets) {
  if (t.resolvedby && SUPPORTERS.includes(t.resolvedby)) {
    if (!byHour.has(hourKey(t))) byHour.set(hourKey(t), []);
    byHour.get(hourKey(t)).push(t);
  }
}

let imputed = 0;
let stillNull = 0;
const removed = {};
const result = [];

for (const t of tickets) {
  if (!t.resolvedby && !t.resolvedat) {
    const candidates = byHour.get(hourKey(t));
    if (candidates?.length) {
      const created = new Date(t.created).getTime();
      const nearest = candidates.reduce((a, b) =>
        Math.abs(new Date(b.created) - created) < Math.abs(new Date(a.created) - created) ? b : a,
      );
      const recorded = Number(t.supportResolution?.timeSpent?.value);
      const minutes = recorded > 0 ? recorded : DEFAULT_MINUTES;
      t.resolvedby = nearest.resolvedby;
      t.resolvedat = new Date(created + minutes * 60000).toISOString();
      t.resolutionInferred = {
        resolvedby: true,
        resolvedat: true,
        basis: `Another ticket in the same hour was resolved by this supporter; resolvedat = created + ${minutes} min (recorded time, else default ${DEFAULT_MINUTES}).`,
      };
      imputed++;
    } else if (DROP_REPORTERS.has(t.from)) {
      removed[t.from] = (removed[t.from] || 0) + 1;
      continue;
    } else {
      stillNull++;
    }
  }
  result.push(t);
}

writeFileSync(out, JSON.stringify(result, null, 2));
console.log({ before: tickets.length, after: result.length, imputed, removed: tickets.length - result.length, stillNull });
console.log(removed);
