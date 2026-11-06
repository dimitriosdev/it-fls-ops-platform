"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import NavLinks, { type NavItem } from "./NavLinks";

// Always expanded on desktop (CSS); on mobile it is a collapsible popup closed by default.
export default function NavMenu({ label, items }: { label: string; items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div className="menu-group" data-open={open} ref={ref}>
      <button
        type="button"
        className="primary-nav-item"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{label}</span>
        <span className="menu-chevron" aria-hidden="true">
          ›
        </span>
      </button>
      <div className="menu-children">
        <NavLinks items={items} />
      </div>
    </div>
  );
}
