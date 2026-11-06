import Link from "next/link";
import type { ReactNode } from "react";
import { TicketStatus } from "@/src/generated/prisma/enums";
import type { Lang } from "@/src/lib/i18n";
import type { TicketListItem } from "@/src/server/queries";
import TopbarTitle from "./TopbarTitle";

const STATUS: Record<TicketStatus, { cls: string; de: string; en: string }> = {
  NEW: { cls: "b-new", de: "Neu", en: "New" },
  IN_PROGRESS: { cls: "b-progress", de: "In Bearbeitung", en: "In progress" },
  RESOLVED: { cls: "b-resolved", de: "Gelöst", en: "Resolved" },
  CLOSED: { cls: "b-closed", de: "Geschlossen", en: "Closed" },
};

export const statusLabel = (s: TicketStatus, lang: Lang) => STATUS[s][lang];

export const ticketRef = (n: number) => `INC-${n}`;

export function formatDate(d: Date | null | undefined): string {
  return d
    ? d.toLocaleString("de-CH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Zurich",
      })
    : "–";
}

export function Badge({ status, lang }: { status: TicketStatus; lang: Lang }) {
  return <span className={`badge ${STATUS[status].cls}`}>{STATUS[status][lang]}</span>;
}

export function PageHead({
  title,
  sub,
  back,
  action,
}: {
  title: ReactNode;
  sub?: ReactNode;
  back?: { href: string; label: string };
  action?: ReactNode;
}) {
  return (
    <>
      {back && (
        <Link className="backlink" href={back.href}>
          ← {back.label}
        </Link>
      )}
      <div className="pagehead no-title">
        <TopbarTitle title={title} sub={sub} />
        {action}
      </div>
    </>
  );
}

export function Metric({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: ReactNode;
  note?: string;
  icon?: string;
}) {
  return (
    <div className="card">
      <div className="metric-label">
        {icon ?? "●"} &nbsp;{label}
      </div>
      <div className="metric">{value}</div>
      <div className="trend">{note}</div>
    </div>
  );
}

export interface SortSpec {
  key: string;
  dir: "asc" | "desc";
  hrefFor: (key: string) => string;
}

export function TicketTable({
  rows,
  lang,
  sort,
}: {
  rows: TicketListItem[];
  lang: Lang;
  sort?: SortSpec;
}) {
  const en = lang === "en";
  if (rows.length === 0) {
    return (
      <div className="empty">
        {en ? "No tickets found." : "Keine Ereignisse gefunden."}
      </div>
    );
  }

  const head = (key: string | null, label: string) => {
    if (!sort || !key) return <th>{label}</th>;
    const on = sort.key === key;
    return (
      <th
        className={`sortable ${on ? "sorted" : ""}`}
        aria-sort={on ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      >
        <Link
          href={sort.hrefFor(key)}
          style={{ color: "inherit", textDecoration: "none" }}
        >
          {label}
          <span className="sortarrow">{on ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}</span>
        </Link>
      </th>
    );
  };

  return (
    <>
      <div className="tablewrap ticket-table-desktop">
        <table>
          <thead>
            <tr>
              {head("ticketNumber", "ID")}
              {head("createdAt", en ? "Created" : "Erstellt")}
              {head(null, en ? "Description" : "Beschreibung")}
              {head(null, en ? "Workplace" : "Arbeitsplatz")}
              {head(null, en ? "Category" : "Kategorie")}
              {head("status", "Status")}
              {head(null, en ? "Assigned to" : "Zugewiesen an")}
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="incident-row">
                <td>
                  <Link href={`/tickets/${t.ticketNumber}`}>
                    {ticketRef(t.ticketNumber)}
                  </Link>
                </td>
                <td>{formatDate(t.createdAt)}</td>
                <td>
                  {t.description.length > 140
                    ? `${t.description.slice(0, 140)}…`
                    : t.description}
                </td>
                <td>{t.workplace.name}</td>
                <td>{t.category.name}</td>
                <td>
                  <Badge status={t.status} lang={lang} />
                </td>
                <td>
                  {t.assignedSupporter?.name ?? (en ? "Unassigned" : "Nicht zugewiesen")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ticket-cards">
        {rows.map((t) => (
          <Link
            className="ticket-card"
            href={`/tickets/${t.ticketNumber}`}
            key={t.id}
            aria-label={`${ticketRef(t.ticketNumber)}: ${t.description}`}
          >
            <div className="ticket-card-heading">
              <Badge status={t.status} lang={lang} />
            </div>
            <p className="ticket-card-description">
              {t.description.length > 140
                ? `${t.description.slice(0, 140)}…`
                : t.description}
            </p>
            <dl className="ticket-card-facts">
              <div>
                <dt>{en ? "Workplace" : "Arbeitsplatz"}</dt>
                <dd>{t.workplace.name}</dd>
              </div>
              <div>
                <dt>{en ? "Category" : "Kategorie"}</dt>
                <dd>{t.category.name}</dd>
              </div>
              <div className="ticket-card-assignee">
                <dt>{en ? "Assigned to" : "Zugewiesen an"}</dt>
                <dd>
                  {t.assignedSupporter?.name ?? (en ? "Unassigned" : "Nicht zugewiesen")}
                </dd>
              </div>
            </dl>
          </Link>
        ))}
      </div>
    </>
  );
}

const DONUT_COLORS = [
  "#f4775d",
  "#3195ee",
  "#13b981",
  "#8b5cf6",
  "#f5a524",
  "#14b8c4",
  "#e5484d",
  "#7a8aa0",
  "#a3c93a",
  "#d946a8",
  "#6366f1",
  "#84cc16",
];

export function Donut({
  rows,
  lang,
}: {
  rows: { label: string; value: number }[];
  lang: Lang;
}) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  let acc = 0;
  const stops = rows
    .map((r, n) => {
      const from = (acc / total) * 100;
      acc += r.value;
      return `${DONUT_COLORS[n % DONUT_COLORS.length]} ${from.toFixed(2)}% ${((acc / total) * 100).toFixed(2)}%`;
    })
    .join(", ");
  return (
    <div className="donutwrap">
      <div
        className="donut"
        style={{ background: `conic-gradient(${stops})` }}
        role="img"
        aria-label="Chart"
      >
        <div>
          <strong>{total}</strong>
          <span>{lang === "en" ? "total" : "gesamt"}</span>
        </div>
      </div>
      <ul className="donutlegend">
        {rows.map((r, n) => (
          <li key={r.label}>
            <i style={{ background: DONUT_COLORS[n % DONUT_COLORS.length] }} />
            <span>{r.label}</span>
            <strong>{r.value}</strong>
            <small>{Math.round((r.value / total) * 100)}%</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BarList({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div>
      {rows.map((r) => (
        <div className="detailrow" key={r.label} style={{ display: "grid", gap: 4 }}>
          <span>
            {r.label} <strong style={{ float: "right" }}>{r.value}</strong>
          </span>
          <div style={{ background: "var(--line)", borderRadius: 4, height: 6 }}>
            <div
              style={{
                width: `${(r.value / max) * 100}%`,
                height: 6,
                borderRadius: 4,
                background: "#3195ee",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
