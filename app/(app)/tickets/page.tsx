import Link from "next/link";
import { TicketStatus, UserRole } from "@/src/generated/prisma/enums";
import { requireUser } from "@/src/lib/auth/authorization";
import { getLang, pick } from "@/src/lib/i18n";
import {
  LIST_MODES,
  PAGE_SIZE,
  isStaff,
  listTickets,
  lookups,
  modeCounts,
  type ListMode,
  type TicketFilters,
} from "@/src/server/queries";
import { PageHead, TicketTable, statusLabel } from "../_components/ui";

export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) || undefined;

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const user = await requireUser();
  const lang = await getLang();
  const t = (de: string, en: string) => pick(lang, de, en);
  const sp = await searchParams;
  const staff = isStaff(user.role);

  const modeParam = one(sp.mode);
  const mode: ListMode = LIST_MODES.find((m) => m === modeParam) ?? "all";
  const statusParam = one(sp.status);
  const sortParam = one(sp.sort);
  const filters: TicketFilters = {
    mode,
    q: one(sp.q)?.slice(0, 100),
    status: Object.values(TicketStatus).find((s) => s === statusParam),
    workplace: one(sp.workplace),
    category: one(sp.category),
    // Supporters default to their own tickets, like the previous demo.
    assignee: staff
      ? sp.assignee === undefined
        ? user.role === UserRole.SUPPORTER
          ? user.id
          : undefined
        : one(sp.assignee)
      : undefined,
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
    const p = new URLSearchParams();
    const base: Record<string, string | undefined> = {
      mode: filters.mode === "all" ? undefined : filters.mode,
      q: filters.q,
      status: filters.status,
      workplace: filters.workplace,
      category: filters.category,
      assignee: sp.assignee === undefined ? undefined : (filters.assignee ?? ""),
      sort: filters.sort === "createdAt" ? undefined : filters.sort,
      dir: filters.dir === "desc" ? undefined : filters.dir,
      ...over,
    };
    for (const [k, v] of Object.entries(base)) if (v) p.set(k, v);
    const s = p.toString();
    return `/tickets${s ? `?${s}` : ""}`;
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
        title={t("Ereignisse", "Incidents")}
        sub={t(
          "Alle gemeldeten und bearbeiteten Ereignisse.",
          "All reported and handled tickets.",
        )}
      />
      {user.role === UserRole.REPORTER && (
        <div className="actionbar">
          <Link className="btn primary" href="/tickets/new">
            ＋ {t("Neues Ereignis", "New incident")}
          </Link>
        </div>
      )}
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
      <form className="filters" method="get">
        {filters.mode !== "all" && (
          <input type="hidden" name="mode" value={filters.mode} />
        )}
        <input
          name="q"
          defaultValue={filters.q}
          placeholder={t("Suchen …", "Search …")}
        />
        <select name="status" defaultValue={filters.status ?? ""}>
          <option value="">{t("Alle Status", "All statuses")}</option>
          {Object.values(TicketStatus).map((s) => (
            <option key={s} value={s}>
              {statusLabel(s, lang)}
            </option>
          ))}
        </select>
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
        {staff && (
          <select name="assignee" defaultValue={filters.assignee ?? ""}>
            <option value="">{t("Alle Zuständigen", "All assignees")}</option>
            <option value="none">{t("Nicht zugewiesen", "Unassigned")}</option>
            {lk.supporters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        <button className="btn" type="submit">
          {t("Filtern", "Filter")}
        </button>
        <Link className="btn" href={staff ? "/tickets?assignee=" : "/tickets"}>
          {t("Zurücksetzen", "Reset")}
        </Link>
      </form>
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
        {total} {t("Ereignisse", "incidents")} · {t("Seite", "Page")} {filters.page}/
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
