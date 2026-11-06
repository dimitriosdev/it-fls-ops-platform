import { requireSupporter } from "@/src/lib/auth/authorization";
import { statsPayload } from "@/src/server/queries";
import { StatsView } from "./StatsView";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  await requireSupporter();
  return <StatsView payload={await statsPayload()} />;
}
