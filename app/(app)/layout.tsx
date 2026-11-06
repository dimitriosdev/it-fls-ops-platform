import Link from "next/link";
import type { ReactNode } from "react";
import { UserRole } from "@/src/generated/prisma/enums";
import { requireUser } from "@/src/lib/auth/authorization";
import { getLang, pick } from "@/src/lib/i18n";
import { countNewTickets, isStaff } from "@/src/server/queries";
import logoMark from "../../assets/images/logo-dg-erp-mark-only.0e1f217bc91f66520a3db5a640b33c5c.svg";
import NavMenu from "./_components/NavMenu";
import type { NavItem } from "./_components/NavLinks";
import UserMenu from "./_components/UserMenu";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await requireUser();
  const lang = await getLang();
  const t = (de: string, en: string) => pick(lang, de, en);
  const staff = isStaff(user.role);
  const logo = logoMark.src || String(logoMark);
  const newCount = staff ? await countNewTickets() : 0;

  const nav: NavItem[] =
    user.role === UserRole.REPORTER
      ? [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/reports", label: t("Berichte", "Reports") },
        ]
      : user.role === UserRole.SUPPORTER
        ? [
            { href: "/dashboard", label: "Dashboard" },
            { href: "/stats", label: t("Berichte", "Reports") },
          ]
        : [
            { href: "/dashboard", label: "Dashboard" },
            { href: "/stats", label: t("Berichte", "Reports") },
            { href: "/admin", label: t("Einstellungen", "Settings") },
          ];
  const inventoryNav: NavItem[] = [
    { href: "/inventory", label: t("Dashboard", "Dashboard") },
    { href: "/inventory/request", label: t("Bestellung anfragen", "Request order") },
  ];
  const roleLabel =
    user.role === UserRole.ADMIN
      ? "Admin"
      : user.role === UserRole.SUPPORTER
        ? "Supporter"
        : "Reporter";

  return (
    <>
      <div className="topline" />
      <div className="app">
        <aside>
          <div className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="logo" src={logo} alt="" />
            <span>IT FLS</span>
          </div>
          <nav className="primary-nav" aria-label="Primary navigation">
            <NavMenu label="Tickets" items={nav} />
            {staff && <NavMenu label={t("Inventar", "Inventory")} items={inventoryNav} />}
          </nav>
          <div className="aside-foot">IT FLS Operations Platform</div>
        </aside>
        <div className="main">
          <header className="topbar">
            <Link className="topbrand" href="/dashboard">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="logo" src={logo} alt="" />
              <span>IT FLS</span>
            </Link>
            <div className="topbar-title" id="topbar-title" />
            <div className="topright">
              {user.role === UserRole.REPORTER && (
                <Link className="btn primary reporter-new-ticket" href="/tickets/new">
                  ＋ {t("Neues Ereignis", "New ticket")}
                </Link>
              )}
              {staff && (
                <Link
                  className="bell"
                  href={
                    user.role === UserRole.SUPPORTER ? "/dashboard" : "/tickets?mode=new"
                  }
                  aria-label={t("Neue Ereignisse", "New tickets")}
                  style={{ textDecoration: "none" }}
                >
                  🔔
                  {newCount > 0 && (
                    <span className="notification-count" style={{ display: "grid" }}>
                      {newCount}
                    </span>
                  )}
                </Link>
              )}
              <UserMenu
                name={user.name}
                email={user.email}
                roleLabel={roleLabel}
                lang={lang}
              />
            </div>
          </header>
          {children}
        </div>
      </div>
    </>
  );
}
