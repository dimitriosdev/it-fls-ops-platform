import Link from "next/link";
import { notFound } from "next/navigation";
import { TicketStatus, UserRole } from "@/src/generated/prisma/enums";
import { requireUser } from "@/src/lib/auth/authorization";
import { getLang, pick } from "@/src/lib/i18n";
import { getTicketByNumber, isStaff, lookups } from "@/src/server/queries";
import { assignAction, ticketQuickAction } from "../actions";
import {
  Badge,
  PageHead,
  formatDate,
  statusLabel,
  ticketRef,
} from "../../_components/ui";

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const lang = await getLang();
  const t = (de: string, en: string) => pick(lang, de, en);
  const number = Number.parseInt((await params).number, 10);
  if (!Number.isInteger(number)) notFound();
  const { error } = await searchParams;

  const ticket = await getTicketByNumber(user, number);
  if (!ticket) notFound();

  const staff = isStaff(user.role);
  const open =
    ticket.status === TicketStatus.NEW || ticket.status === TicketStatus.IN_PROGRESS;
  const mine = ticket.assignedSupporterId === user.id;
  const isOwner = ticket.reporterId === user.id;
  const supporters = user.role === UserRole.ADMIN ? (await lookups()).supporters : [];

  const quick = (kind: string, label: string, primary = false) => (
    <form action={ticketQuickAction}>
      <input type="hidden" name="ticketNumber" value={number} />
      <input type="hidden" name="kind" value={kind} />
      <button className={`btn${primary ? " primary" : ""}`} type="submit">
        {label}
      </button>
    </form>
  );

  const fact = (label: string, value: React.ReactNode) => (
    <div>
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );

  return (
    <main className="content">
      <PageHead
        title={`${ticketRef(number)}`}
        sub={<Badge status={ticket.status} lang={lang} />}
        back={{ href: "/tickets", label: t("Ereignisse", "Incidents") }}
      />
      {error && (
        <div className="notice" role="alert">
          {error}
        </div>
      )}

      <div className="actionbar">
        {staff && open && !mine && quick("takeover", t("Übernehmen", "Take over"), true)}
        {staff && open && mine && (
          <Link className="btn primary" href={`/tickets/${number}/resolve`}>
            {t("Lösen", "Resolve")}
          </Link>
        )}
        {!staff &&
          isOwner &&
          open &&
          quick("reporter-resolve", t("Als gelöst markieren", "Mark as resolved"), true)}
        {ticket.status === TicketStatus.RESOLVED &&
          (staff || isOwner) &&
          quick("close", t("Schliessen", "Close"), true)}
        {!open && (staff || isOwner) && quick("reopen", t("Wieder öffnen", "Reopen"))}
      </div>

      {supporters.length > 0 && open && (
        <form action={assignAction} className="filters">
          <input type="hidden" name="ticketNumber" value={number} />
          <select
            name="supporterId"
            defaultValue={ticket.assignedSupporterId ?? ""}
            required
          >
            <option value="" disabled>
              {t("Zuweisen an …", "Assign to …")}
            </option>
            {supporters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button className="btn" type="submit">
            {t("Zuweisen", "Assign")}
          </button>
        </form>
      )}

      <div className="detailgrid">
        <div className="card">
          <h3>{t("Beschreibung", "Description")}</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{ticket.description}</p>
          {ticket.resolutionText && (
            <>
              <h3>{t("Lösung", "Resolution")}</h3>
              <p style={{ whiteSpace: "pre-wrap" }}>{ticket.resolutionText}</p>
            </>
          )}
          {ticket.attachments.length > 0 && (
            <>
              <h3>{t("Anhänge", "Attachments")}</h3>
              <ul>
                {ticket.attachments.map((a) => (
                  <li key={a.id}>
                    <a href={a.url} target="_blank" rel="noopener noreferrer">
                      {a.filename}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="card">
          <div className="factgrid">
            {fact(t("Status", "Status"), statusLabel(ticket.status, lang))}
            {fact(t("Melder", "Reporter"), ticket.reporter.name)}
            {fact(t("Zuständig", "Assignee"), ticket.assignedSupporter?.name ?? "–")}
            {fact(t("Arbeitsplatz", "Workplace"), ticket.workplace.name)}
            {fact(t("Kategorie", "Category"), ticket.category.name)}
            {fact(t("Erstellt", "Created"), formatDate(ticket.createdAt))}
            {fact(t("Gelöst", "Resolved"), formatDate(ticket.resolvedAt))}
            {fact(t("Geschlossen", "Closed"), formatDate(ticket.closedAt))}
            {ticket.timeSpentMinutes != null &&
              fact(t("Aufwand", "Time spent"), `${ticket.timeSpentMinutes} min`)}
            {ticket.externalFollowup &&
              fact(t("Extern", "External"), ticket.externalPerson ?? "–")}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>{t("Verlauf", "History")}</h3>
        <div className="timeline">
          {ticket.history.map((h) => (
            <div className="event" key={h.id}>
              <b>
                {h.action}
                {h.toStatus ? ` → ${statusLabel(h.toStatus, lang)}` : ""}
              </b>
              <div className="sub">
                {formatDate(h.occurredAt)} · {h.actor?.name ?? "–"}
              </div>
              {h.details && <div>{h.details}</div>}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
