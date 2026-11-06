import { requireUser } from "@/src/lib/auth/authorization";
import { getLang, pick } from "@/src/lib/i18n";
import { lookups } from "@/src/server/queries";
import { PageHead } from "../../_components/ui";
import NewTicketForm from "./NewTicketForm";

export const dynamic = "force-dynamic";

export default async function NewTicketPage() {
  await requireUser();
  const lang = await getLang();
  const lk = await lookups();
  return (
    <main className="content">
      <PageHead
        title={pick(lang, "Neues Ereignis", "New incident")}
        sub={pick(
          lang,
          "Erfasse ein Problem in wenigen Schritten.",
          "Report an issue in just a few steps.",
        )}
        back={{ href: "/tickets", label: pick(lang, "Ereignisse", "Tickets") }}
      />
      <div className="card">
        <NewTicketForm
          workplaces={lk.workplaces.map((w) => w.name)}
          categories={lk.categories.map((c) => c.name)}
          lang={lang}
        />
      </div>
    </main>
  );
}
