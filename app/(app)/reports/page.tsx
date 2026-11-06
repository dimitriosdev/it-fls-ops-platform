import { redirect } from "next/navigation";
import { UserRole } from "@/src/generated/prisma/enums";
import { requireUser } from "@/src/lib/auth/authorization";
import { getLang, pick } from "@/src/lib/i18n";
import { reporterTicketReports } from "@/src/server/queries";
import { BarList, Metric, PageHead } from "../_components/ui";

export const dynamic = "force-dynamic";

export default async function ReporterReportsPage() {
  const user = await requireUser();
  if (user.role !== UserRole.REPORTER) redirect("/stats");

  const lang = await getLang();
  const t = (de: string, en: string) => pick(lang, de, en);
  const reports = await reporterTicketReports(user.id);
  const empty = t("Noch keine Ereignisse vorhanden.", "No tickets yet.");

  return (
    <main className="content">
      <PageHead
        title={t("Meine Berichte", "My reports")}
        sub={t(
          "Übersicht über die von dir gemeldeten Ereignisse.",
          "A summary of the tickets you have reported.",
        )}
      />
      <div className="reporter-report-grid">
        <Metric
          label={t("Gemeldete Ereignisse", "Tickets raised")}
          value={reports.total}
          note={t("Insgesamt gemeldet", "Reported in total")}
        />
        <section className="card">
          <h2>{t("Häufigste Kategorien / Geräte", "Top categories / devices")}</h2>
          {reports.topCategories.length ? (
            <BarList rows={reports.topCategories} />
          ) : (
            <p className="sub">{empty}</p>
          )}
        </section>
        <section className="card">
          <h2>{t("Häufigste Arbeitsplätze", "Top workplaces")}</h2>
          {reports.topWorkplaces.length ? (
            <BarList rows={reports.topWorkplaces} />
          ) : (
            <p className="sub">{empty}</p>
          )}
        </section>
      </div>
    </main>
  );
}
