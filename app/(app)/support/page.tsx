import { redirect } from "next/navigation";
import { requireSupporter } from "@/src/lib/auth/authorization";

export const dynamic = "force-dynamic";

// Staff workbench: the open-ticket list.
export default async function SupportPage() {
  await requireSupporter();
  redirect("/tickets?mode=open");
}
