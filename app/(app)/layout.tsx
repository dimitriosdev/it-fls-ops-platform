import Link from "next/link";
import type { ReactNode } from "react";
import { UserRole } from "@/src/generated/prisma/enums";
import { requireUser } from "@/src/lib/auth/authorization";
import { getLang, pick } from "@/src/lib/i18n";
import { countNewTickets, isStaff } from "@/src/server/queries";
import logoMark from "../../assets/images/logo-dg-erp-mark-only.0e1f217bc91f66520a3db5a640b33c5c.svg";
import NavLinks, { type NavItem } from "./_components/NavLinks";
import UserMenu from "./_components/UserMenu";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await requireUser();
  const lang = await getLang();
  const t = (de: string, en: string) => pick(lang, de, en);
  const staff = isStaff(user.role);
  const logo = logoMark.src || String(logoMark);
  const newCount = staff ? await countNewTickets() : 0;

  const nav: NavItem[] = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/tickets", label: t("Ereignisse", "Incidents") },
    ...(user.role === UserRole.REPORTER
      ? [{ href: "/tickets/new", label: t("Neues Ereignis", "New incident") }]
      : []),
    ...(staff ? [{ href: "/stats", label: t("Berichte", "Reports") }] : []),
    ...(user.role === UserRole.ADMIN
      ? [{ href: "/admin", label: t("Einstellungen", "Settings") }]
      : []),
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
          <nav className="primary-nav" aria-label="Workspace navigation">
            <div className="menu-group" data-open="true">
              <div className="primary-nav-item">
                <span>Tickets</span>
              </div>
              <div className="menu-children">
                <NavLinks items={nav} />
              </div>
            </div>
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
            <div className="topbar-title" />
            <div className="topright">
              {staff && (
                <Link
                  className="bell"
                  href="/tickets?mode=new"
                  aria-label={t("Neue Ereignisse", "New incidents")}
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
