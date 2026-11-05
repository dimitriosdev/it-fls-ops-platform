import { timingSafeEqual } from "node:crypto";
import stats from "../../../data/stats.json";

export const dynamic = "force-dynamic";

function pinMatches(candidate: unknown): boolean {
  const pin = process.env.STATS_PIN;
  if (!pin || typeof candidate !== "string") return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(pin);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request): Promise<Response> {
  let body: { pin?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // treated as a wrong PIN below
  }
  if (!pinMatches(body.pin)) {
    return Response.json({ error: "Invalid PIN" }, { status: 401 });
  }
  return Response.json(stats, { headers: { "Cache-Control": "no-store" } });
}
