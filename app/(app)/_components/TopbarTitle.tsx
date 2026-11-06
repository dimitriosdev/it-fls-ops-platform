"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Renders the page title and subtitle into the top bar, next to the bell, to save vertical space.
export default function TopbarTitle({
  title,
  sub,
}: {
  title: ReactNode;
  sub?: ReactNode;
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => setTarget(document.getElementById("topbar-title")), []);
  if (!target) return null;
  return createPortal(
    <>
      <h1>{title}</h1>
      {sub ? <div className="sub">{sub}</div> : null}
    </>,
    target,
  );
}
