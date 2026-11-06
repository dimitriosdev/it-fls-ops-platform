"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, type ChangeEvent, type FormEvent, type ReactNode } from "react";

export default function AutoFilterForm({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyFilters = (form: HTMLFormElement) => {
    const params = new URLSearchParams(searchParams.toString());
    const formData = new FormData(form);

    for (const [key, value] of formData.entries()) {
      params.delete(key);
      if (typeof value === "string" && value !== "") params.set(key, value);
    }

    params.delete("status");
    params.delete("page");
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  };

  const onChange = (event: ChangeEvent<HTMLFormElement>) => {
    const target = event.target;
    if (target instanceof HTMLSelectElement) {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      applyFilters(event.currentTarget);
    } else if (target instanceof HTMLInputElement && target.type === "search") {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      const form = event.currentTarget;
      searchTimer.current = setTimeout(() => applyFilters(form), 300);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (searchTimer.current) clearTimeout(searchTimer.current);
    applyFilters(event.currentTarget);
  };

  return (
    <form className={className} onChange={onChange} onSubmit={onSubmit}>
      {children}
    </form>
  );
}
