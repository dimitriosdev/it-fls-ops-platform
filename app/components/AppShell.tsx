"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import UserMenu from "./UserMenu";

type MenuKey = "tickets" | "inventory";

interface BrandProps {
  className: string;
  logoSrc: string;
  onClick?: () => void;
}

function Brand({ className, logoSrc, onClick }: BrandProps): React.JSX.Element {
  const content = (
    <>
      <img className="logo" src={logoSrc} alt="" />
      <span>IT FLS</span>
    </>
  );

  if (onClick) {
    return (
      <button className={className} onClick={onClick} type="button">
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

function Sidebar({ logoSrc }: { logoSrc: string }): React.JSX.Element {
  const [openMenu, setOpenMenu] = useState<MenuKey | null>("tickets");

  useEffect(() => {
    if (window.matchMedia("(max-width: 620px)").matches) setOpenMenu(null);
  }, []);

  useEffect(() => {
    function handleClick(event: MouseEvent): void {
      const target = event.target;
      if (
        window.matchMedia("(max-width: 620px)").matches &&
        target instanceof Element &&
        !target.closest("aside")
      ) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  function toggle(key: MenuKey): void {
    setOpenMenu((current) => (current === key ? null : key));
  }

  function group(key: MenuKey, label: string, children: ReactNode): React.JSX.Element {
    const open = openMenu === key;
    return (
      <div className="menu-group" data-open={open}>
        <button
          className="primary-nav-item"
          type="button"
          aria-expanded={open}
          onClick={() => toggle(key)}
        >
          <span>{label}</span>
          <span className="menu-chevron" aria-hidden="true">
            ›
          </span>
        </button>
        {children}
      </div>
    );
  }

  return (
    <aside>
      <Brand className="brand" logoSrc={logoSrc} />
      <nav className="primary-nav" aria-label="Workspace navigation">
        {group(
          "tickets",
          "Tickets",
          <div className="menu-children" id="nav" aria-label="Tickets navigation" />,
        )}
        {group(
          "inventory",
          "Inventory",
          <div className="menu-children">
            <button className="menu-child" type="button" disabled>
              Overview
            </button>
            <button className="menu-child" type="button" disabled>
              Order Requests
            </button>
          </div>,
        )}
      </nav>
      <div className="aside-foot">
        Incident Demo · v1.0
        <br />
        Sample data only
      </div>
    </aside>
  );
}

function PageTitle(): React.JSX.Element {
  return (
    <div className="topbar-title">
      <h1 id="topbarTitle" />
      <div className="sub" id="topbarSub" />
    </div>
  );
}

function NotificationButton({ onClick }: { onClick: () => void }): React.JSX.Element {
  return (
    <button
      className="bell"
      id="notificationBell"
      onClick={onClick}
      aria-label="Notifications"
      type="button"
    >
      🔔
      <span id="notificationCount" className="notification-count" />
    </button>
  );
}

function Topbar({
  logoSrc,
  onHomeClick,
  onNotifications,
}: {
  logoSrc: string;
  onHomeClick: () => void;
  onNotifications: () => void;
}): React.JSX.Element {
  return (
    <header className="topbar">
      <Brand className="topbrand" logoSrc={logoSrc} onClick={onHomeClick} />
      <PageTitle />
      <div className="topright">
        <NotificationButton onClick={onNotifications} />
        <UserMenu />
      </div>
    </header>
  );
}

export default function AppShell({
  children,
  logoSrc,
  onHomeClick,
  onNotifications,
}: {
  children: ReactNode;
  logoSrc: string;
  onHomeClick: () => void;
  onNotifications: () => void;
}): React.JSX.Element {
  return (
    <>
      <div className="topline" />
      <div className="app">
        <Sidebar logoSrc={logoSrc} />
        <div className="main">
          <Topbar
            logoSrc={logoSrc}
            onHomeClick={onHomeClick}
            onNotifications={onNotifications}
          />
          {children}
        </div>
      </div>
      <div id="toastroot" />
    </>
  );
}
