import Link from "next/link";
import { UserRole } from "@/src/generated/prisma/enums";
import { requireUser } from "@/src/lib/auth/authorization";
import { getLang, pick } from "@/src/lib/i18n";
import { adminOverview, reporterDashboard, staffDashboard } from "@/src/server/queries";
import { BarList, Donut, Metric, PageHead, TicketTable } from "../_components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const lang = await getLang();
  const t = (de: string, en: string) => pick(lang, de, en);

  if (user.role === UserRole.REPORTER) {
    const { active, closedCount, closedByCategory } = await reporterDashboard(user.id);
    return (
      <main className="content">
        <PageHead
          title={t("Mein Dashboard", "My Dashboard")}
          sub={t(
            "Deine gemeldeten Ereignisse und ihr aktueller Status.",
            "Your reported incidents and their current status.",
          )}
        />
        <div className="actionbar">
          <Link className="btn primary" href="/tickets/new">
            ＋ {t("Neues Ereignis", "New incident")}
          </Link>
          <span className="actionhint">
            {t(
              "Etwas funktioniert nicht? Melde ein neues Problem.",
              "Something not working? Report a new problem.",
            )}
          </span>
        </div>
        <div className="cards">
          <Metric
            label={t("Offene Ereignisse", "Not closed")}
            value={active.length}
            note={t("Deine aktive Liste", "Your active list")}
            icon="◷"
          />
          <Metric
            label={t("Geschlossene Ereignisse", "Closed incidents")}
            value={closedCount}
            note={t("Alle geschlossenen Meldungen", "All closed reports")}
            icon="✓"
          />
        </div>
        <div className="card">
          <h2>{t("Meine offenen / aktiven Ereignisse", "My open / active incidents")}</h2>
          <TicketTable rows={active} lang={lang} />
        </div>
        <div className="card" style={{ marginTop: 16 }}>
          <h2>
            {t("Geschlossene Ereignisse nach Kategorie", "Closed incidents by category")}
          </h2>
          {closedByCategory.length ? (
            <Donut rows={closedByCategory} lang={lang} />
          ) : (
            t("Noch keine geschlossenen Ereignisse.", "No closed incidents yet.")
          )}
        </div>
      </main>
    );
  }

  const staff = await staffDashboard();
  const overview = user.role === UserRole.ADMIN ? await adminOverview() : null;

  return (
    <main className="content">
      <PageHead
        title={
          user.role === UserRole.ADMIN
            ? t("Übersicht Teamleitung", "Team overview")
            : t("Support-Dashboard", "Support Dashboard")
        }
        sub={t(
          "Offene Arbeit und direkte Lösungen durch Support.",
          "Open workload and direct Support resolutions.",
        )}
      />
      <div className="actionbar">
        <Link className="btn primary" href="/tickets?mode=open">
          ▤ {t("Ereignisliste öffnen", "Tickets list")} ({staff.open})
        </Link>
        <span className="actionhint">
          {t(
            "Alle offenen Ereignisse ansehen und eines übernehmen.",
            "See all open tickets and pick one up.",
          )}
        </span>
      </div>
      <div className="cards">
        <Metric
          label={t("Offene Ereignisse", "Open tickets")}
          value={staff.open}
          note={t("Neu oder in Bearbeitung", "New or in progress")}
          icon="◷"
        />
        <Metric
          label={t("Nicht zugewiesen", "Unassigned")}
          value={staff.unassigned}
          note={t("Warten auf Übernahme", "Waiting to be picked up")}
          icon="!"
        />
        <Metric
          label={t("Heute gelöst", "Resolved today")}
          value={staff.resolvedToday}
          note={t("Direkt durch Support", "Directly by Support")}
          icon="✓"
        />
        <Metric
          label={t("Diese Woche gelöst", "Resolved this week")}
          value={staff.resolvedWeek}
          note={t("Direkt durch Support", "Directly by Support")}
          icon="✓"
        />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h2>{t("Neue Ereignisse", "New incidents")}</h2>
        <TicketTable rows={staff.newTickets} lang={lang} />
      </div>
      {overview && (
        <>
          <div className="grid2" style={{ marginTop: 16 }}>
            <div className="card">
              <h2>{t("Offen pro Supporter", "Open per supporter")}</h2>
              <BarList
                rows={overview.openBySupporter.map((s) => ({
                  label: s.unassigned ? t("Nicht zugewiesen", "Unassigned") : s.label,
                  value: s.value,
                }))}
              />
            </div>
            <div className="card">
              <h2>{t("Ereignisse nach Kategorie", "Incidents by category")}</h2>
              <BarList rows={overview.topCategories} />
            </div>
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <h2>{t("Ereignisse nach Arbeitsplatz", "Incidents by workplace")}</h2>
            <BarList rows={overview.topWorkplaces} />
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <h2>{t("Letzte Ereignisse", "Recent incidents")}</h2>
            <TicketTable rows={overview.recent} lang={lang} />
          </div>
        </>
      )}
    </main>
  );
}
