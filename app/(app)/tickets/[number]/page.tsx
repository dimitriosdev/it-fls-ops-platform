import Link from "next/link";
import { notFound } from "next/navigation";
import {
  TicketStatus,
  UserRole,
  type TicketHistoryAction,
} from "@/src/generated/prisma/enums";
import { requireUser } from "@/src/lib/auth/authorization";
import { getLang, pick } from "@/src/lib/i18n";
import { getTicketByNumber, isStaff, lookups } from "@/src/server/queries";
import { assignAction, ticketQuickAction } from "../actions";
import TicketDescription from "./TicketDescription";
import {
  Badge,
  PageHead,
  formatDate,
  statusLabel,
  ticketRef,
} from "../../_components/ui";

export const dynamic = "force-dynamic";

const HISTORY_ACTION_LABELS: Record<TicketHistoryAction, { de: string; en: string }> = {
  CREATED: { de: "Ticket erstellt", en: "Ticket created" },
  ASSIGNED: { de: "Zuständigkeit geändert", en: "Assignee changed" },
  STATUS_CHANGED: { de: "Status geändert", en: "Status changed" },
  RESOLVED: { de: "Ticket gelöst", en: "Ticket resolved" },
  CLOSED: { de: "Ticket geschlossen", en: "Ticket closed" },
  REOPENED: { de: "Ticket wieder geöffnet", en: "Ticket reopened" },
};

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
  const canEditDescription = user.role === UserRole.REPORTER && isOwner && open;
  const supporters = user.role === UserRole.ADMIN ? (await lookups()).supporters : [];
  const hasActions =
    (staff && open) ||
    (!staff && isOwner && open) ||
    (ticket.status === TicketStatus.RESOLVED && (staff || isOwner)) ||
    (!open && (staff || isOwner)) ||
    (supporters.length > 0 && open);

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
    <div className="ticket-fact">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );

  return (
    <main className="content">
      <PageHead
        title={`${ticketRef(number)}`}
        sub={<Badge status={ticket.status} lang={lang} />}
        back={{
          href: "/dashboard",
          label: t("Ereignisse", "Tickets"),
        }}
      />
      {error && (
        <div className="notice" role="alert">
          {error}
        </div>
      )}

      <div className="detailgrid ticket-detail-grid">
        <section className="card ticket-description-card">
          <TicketDescription
            ticketNumber={number}
            description={ticket.description}
            workplace={ticket.workplace.name}
            category={ticket.category.name}
            lang={lang}
            editable={canEditDescription}
          >
            <dl className="ticket-facts">
              {fact(t("Status", "Status"), <Badge status={ticket.status} lang={lang} />)}
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
            </dl>
          </TicketDescription>
          {ticket.resolutionText && (
            <section className="ticket-content-section">
              <h3>{t("Lösung", "Resolution")}</h3>
              <p className="ticket-description">{ticket.resolutionText}</p>
            </section>
          )}
          {ticket.attachments.length > 0 && (
            <section className="ticket-content-section">
              <h3>{t("Anhänge", "Attachments")}</h3>
              <ul className="ticket-attachments">
                {ticket.attachments.map((a) => (
                  <li key={a.id}>
                    <a href={a.url} target="_blank" rel="noopener noreferrer">
                      {a.filename}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hasActions ? (
            <div className={`ticket-actions${!staff ? " reporter-ticket-actions" : ""}`}>
              {staff &&
                open &&
                !mine &&
                quick("takeover", t("Übernehmen", "Take over"), true)}
              {staff && open && mine && (
                <Link className="btn primary" href={`/tickets/${number}/resolve`}>
                  {t("Lösen", "Resolve")}
                </Link>
              )}
              {!staff &&
                isOwner &&
                open &&
                quick(
                  "reporter-resolve",
                  t("Als gelöst markieren", "Mark as resolved"),
                  true,
                )}
              {ticket.status === TicketStatus.RESOLVED &&
                (staff || isOwner) &&
                quick("close", t("Schliessen", "Close"), true)}
              {!open &&
                (staff || isOwner) &&
                quick("reopen", t("Wieder öffnen", "Reopen"))}
              {supporters.length > 0 && open && (
                <form action={assignAction} className="ticket-assignment">
                  <input type="hidden" name="ticketNumber" value={number} />
                  <select
                    name="supporterId"
                    defaultValue={ticket.assignedSupporterId ?? ""}
                    required
                    aria-label={t("Zuständigen Supporter auswählen", "Choose assignee")}
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
            </div>
          ) : null}
        </section>

        <section className="card ticket-history-card">
          <h2>{t("Verlauf", "History")}</h2>
          {ticket.history.length ? (
            <div className="ticket-history">
              {ticket.history.map((h) => (
                <article className="ticket-history-event" key={h.id}>
                  <span className="ticket-history-marker" aria-hidden="true" />
                  <div className="ticket-history-body">
                    <strong>
                      {HISTORY_ACTION_LABELS[h.action][lang]}
                      {h.toStatus ? ` → ${statusLabel(h.toStatus, lang)}` : ""}
                    </strong>
                    <div className="ticket-history-meta">
                      <time dateTime={h.occurredAt.toISOString()}>
                        {formatDate(h.occurredAt)}
                      </time>
                      <span>{h.actor?.name ?? "–"}</span>
                    </div>
                    {h.details && <p>{h.details}</p>}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="ticket-history-empty">
              {t("Für dieses Ticket gibt es noch keinen Verlauf.", "No history yet.")}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
