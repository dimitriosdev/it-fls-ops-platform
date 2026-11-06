import Link from "next/link";
import { UserRole } from "@/src/generated/prisma/enums";
import { requireUser } from "@/src/lib/auth/authorization";
import { getLang, pick } from "@/src/lib/i18n";
import {
  LIST_MODES,
  listTickets,
  lookups,
  modeCounts,
  PAGE_SIZE,
  type ListMode,
  type TicketFilters,
} from "@/src/server/queries";
import { PageHead, TicketTable } from "../_components/ui";
import AutoFilterForm from "../_components/AutoFilterForm";

export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) || undefined;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const user = await requireUser();
  const lang = await getLang();
  const t = (de: string, en: string) => pick(lang, de, en);

  if (user.role === UserRole.REPORTER) {
    const sp = await searchParams;
    const mode: ListMode = LIST_MODES.find((m) => m === one(sp.mode)) ?? "all";
    const sortParam = one(sp.sort);
    const filters: TicketFilters = {
      mode,
      q: one(sp.q)?.slice(0, 100),
      sort:
        sortParam === "ticketNumber" || sortParam === "status" ? sortParam : "createdAt",
      dir: one(sp.dir) === "asc" ? "asc" : "desc",
      page: Math.max(1, Number.parseInt(one(sp.page) ?? "1", 10) || 1),
    };
    const [{ items, total }, counts] = await Promise.all([
      listTickets(user, filters),
      modeCounts(user),
    ]);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const query = (over: Record<string, string | undefined>) => {
      const base: Record<string, string | undefined> = {
        mode: filters.mode === "all" ? undefined : filters.mode,
        q: filters.q,
        sort: filters.sort === "createdAt" ? undefined : filters.sort,
        dir: filters.dir === "desc" ? undefined : filters.dir,
        ...over,
      };
      const p = new URLSearchParams();
      for (const [key, value] of Object.entries(base)) {
        if (value) p.set(key, value);
      }
      const queryString = p.toString();
      return `/dashboard${queryString ? `?${queryString}` : ""}`;
    };
    const tabLabels: Record<ListMode, string> = {
      all: t("Alle Ereignisse", "All tickets"),
      open: t("Offen", "Open"),
      new: t("Neu", "New"),
      resolved: t("Gelöst", "Resolved"),
      closed: t("Geschlossen", "Closed"),
    };

    return (
      <main className="content reporter-dashboard">
        <PageHead
          title={t("Mein Dashboard", "My Dashboard")}
          sub={t("Deine gemeldeten Ereignisse.", "Your reported tickets.")}
        />
        <div className="pilltabs incident-view-tabs">
          {LIST_MODES.map((m) => (
            <Link
              key={m}
              href={query({ mode: m === "all" ? undefined : m, page: undefined })}
              className={filters.mode === m ? "active" : ""}
            >
              {tabLabels[m]} <span>({counts[m]})</span>
            </Link>
          ))}
        </div>
        <AutoFilterForm className="filters reporter-ticket-filters">
          <input type="hidden" name="mode" value={filters.mode} />
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder={t("Suchen …", "Search …")}
            aria-label={t("Ereignisse suchen", "Search tickets")}
          />
        </AutoFilterForm>
        <TicketTable
          rows={items}
          lang={lang}
          sort={{
            key: filters.sort,
            dir: filters.dir,
            hrefFor: (key) =>
              query({
                sort: key,
                dir: filters.sort === key && filters.dir === "asc" ? "desc" : "asc",
                page: undefined,
              }),
          }}
        />
        <p className="sub" style={{ marginTop: 12 }}>
          {total} {t("Ereignisse", "tickets")} · {t("Seite", "Page")} {filters.page}/
          {pages}
        </p>
        {pages > 1 && (
          <div className="formactions" style={{ justifyContent: "flex-start" }}>
            {filters.page > 1 && (
              <Link className="btn" href={query({ page: String(filters.page - 1) })}>
                ← {t("Zurück", "Previous")}
              </Link>
            )}
            {filters.page < pages && (
              <Link className="btn" href={query({ page: String(filters.page + 1) })}>
                {t("Weiter", "Next")} →
              </Link>
            )}
          </div>
        )}
      </main>
    );
  } else {
    const sp = await searchParams;
    const mode: ListMode = LIST_MODES.find((m) => m === one(sp.mode)) ?? "new";
    const sortParam = one(sp.sort);
    const filters: TicketFilters = {
      mode,
      q: one(sp.q)?.slice(0, 100),
      workplace: one(sp.workplace),
      category: one(sp.category),
      assignee: one(sp.assignee),
      sort:
        sortParam === "ticketNumber" || sortParam === "status" ? sortParam : "createdAt",
      dir: one(sp.dir) === "asc" ? "asc" : "desc",
      page: Math.max(1, Number.parseInt(one(sp.page) ?? "1", 10) || 1),
    };
    const [{ items, total }, counts, lk] = await Promise.all([
      listTickets(user, filters),
      modeCounts(user, filters.assignee),
      lookups(),
    ]);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const query = (over: Record<string, string | undefined>) => {
      const base: Record<string, string | undefined> = {
        mode: filters.mode === "new" ? undefined : filters.mode,
        q: filters.q,
        workplace: filters.workplace,
        category: filters.category,
        assignee: filters.assignee,
        sort: filters.sort === "createdAt" ? undefined : filters.sort,
        dir: filters.dir === "desc" ? undefined : filters.dir,
        ...over,
      };
      const p = new URLSearchParams();
      for (const [key, value] of Object.entries(base)) {
        if (value) p.set(key, value);
      }
      const queryString = p.toString();
      return `/dashboard${queryString ? `?${queryString}` : ""}`;
    };
    const tabLabels: Record<ListMode, string> = {
      all: t("Alle Ereignisse", "All tickets"),
      open: t("Offen", "Open"),
      new: t("Neu", "New"),
      resolved: t("Gelöst", "Resolved"),
      closed: t("Geschlossen", "Closed"),
    };

    return (
      <main className="content">
        <PageHead
          title={t("Support-Dashboard", "Support Dashboard")}
          sub={t(
            "Neue und bearbeitete Ereignisse für Support.",
            "New and handled tickets for Support.",
          )}
        />
        <div className="pilltabs incident-view-tabs">
          {LIST_MODES.map((m) => (
            <Link
              key={m}
              href={query({
                mode: m === "new" ? undefined : m,
                page: undefined,
              })}
              className={filters.mode === m ? "active" : ""}
            >
              {tabLabels[m]} <span>({counts[m]})</span>
            </Link>
          ))}
        </div>
        <AutoFilterForm className="filters">
          <input type="hidden" name="mode" value={filters.mode} />
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder={t("Suchen …", "Search …")}
            aria-label={t("Ereignisse suchen", "Search tickets")}
          />
          <select name="workplace" defaultValue={filters.workplace ?? ""}>
            <option value="">{t("Alle Arbeitsplätze", "All workplaces")}</option>
            {lk.workplaces.map((w) => (
              <option key={w.name}>{w.name}</option>
            ))}
          </select>
          <select name="category" defaultValue={filters.category ?? ""}>
            <option value="">{t("Alle Kategorien", "All categories")}</option>
            {lk.categories.map((c) => (
              <option key={c.name}>{c.name}</option>
            ))}
          </select>
          <select name="assignee" defaultValue={filters.assignee ?? ""}>
            <option value="">{t("Alle Zuständigen", "All assignees")}</option>
            <option value="none">{t("Nicht zugewiesen", "Unassigned")}</option>
            {lk.supporters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </AutoFilterForm>
        <TicketTable
          rows={items}
          lang={lang}
          sort={{
            key: filters.sort,
            dir: filters.dir,
            hrefFor: (key) =>
              query({
                sort: key,
                dir: filters.sort === key && filters.dir === "asc" ? "desc" : "asc",
                page: undefined,
              }),
          }}
        />
        <p className="sub" style={{ marginTop: 12 }}>
          {total} {t("Ereignisse", "tickets")} · {t("Seite", "Page")} {filters.page}/
          {pages}
        </p>
        {pages > 1 && (
          <div className="formactions" style={{ justifyContent: "flex-start" }}>
            {filters.page > 1 && (
              <Link className="btn" href={query({ page: String(filters.page - 1) })}>
                ← {t("Zurück", "Previous")}
              </Link>
            )}
            {filters.page < pages && (
              <Link className="btn" href={query({ page: String(filters.page + 1) })}>
                {t("Weiter", "Next")} →
              </Link>
            )}
          </div>
        )}
      </main>
    );
  }
}
