"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
}

function NavIcon({ href }: { href: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
  };

  if (href === "/admin") {
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.9l-1.4-1.2 1.4-2.4 1.7.7a8 8 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.6.9l1.7-.7 1.4 2.4-1.4 1.2a7 7 0 0 1 0 1.8Z" />
      </svg>
    );
  }

  if (href === "/stats" || href === "/reports") {
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="M4 19.5h16" />
        <rect x="5.5" y="11" width="3.5" height="6.5" rx="1" />
        <rect x="10.25" y="7.5" width="3.5" height="10" rx="1" />
        <rect x="15" y="4.5" width="3.5" height="13" rx="1" />
      </svg>
    );
  }

  if (href === "/inventory/request") {
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="M7 3.75h7l4 4v12.5H7z" />
        <path d="M14 3.75v4h4M10 12h5M10 16h5" />
      </svg>
    );
  }

  if (href === "/inventory") {
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="m3.5 8 8.5-4.5L20.5 8v11l-8.5 4-8.5-4z" />
        <path d="M3.5 8 12 12.5 20.5 8M12 12.5V23M8 6l8.5 4.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" {...common}>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </svg>
  );
}

export default function NavLinks({ items }: { items: NavItem[] }): React.JSX.Element {
  const pathname = usePathname();
  return (
    <>
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href === "/dashboard" && /^\/tickets\/\d+(?:\/|$)/.test(pathname)) ||
          (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`menu-child ${active ? "active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="menu-child-icon" aria-hidden="true">
              <NavIcon href={item.href} />
            </span>
            <span className="menu-child-label">{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}
