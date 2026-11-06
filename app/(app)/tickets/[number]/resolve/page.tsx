import { notFound, redirect } from "next/navigation";
import { TicketStatus } from "@/src/generated/prisma/enums";
import { requireSupporter } from "@/src/lib/auth/authorization";
import { getLang, pick } from "@/src/lib/i18n";
import { getTicketByNumber } from "@/src/server/queries";
import { PageHead, ticketRef } from "../../../_components/ui";
import ResolveForm from "./ResolveForm";

export const dynamic = "force-dynamic";

export default async function ResolvePage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const user = await requireSupporter();
  const lang = await getLang();
  const number = Number.parseInt((await params).number, 10);
  if (!Number.isInteger(number)) notFound();

  const ticket = await getTicketByNumber(user, number);
  if (!ticket) notFound();
  if (ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED) {
    redirect(`/tickets/${number}`);
  }

  return (
    <main className="content">
      <PageHead
        title={pick(lang, "Ereignis lösen", "Resolve incident")}
        sub={`${ticketRef(number)} · ${pick(lang, "Ergebnis dokumentieren", "Record the outcome")}`}
        back={{ href: `/tickets/${number}`, label: ticketRef(number) }}
      />
      <div className="card" style={{ maxWidth: 850 }}>
        <ResolveForm ticketNumber={number} lang={lang} />
      </div>
    </main>
  );
}
