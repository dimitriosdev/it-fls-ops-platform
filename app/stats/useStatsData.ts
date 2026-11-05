"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { compute } from "./aggregate";
import type { Payload } from "./aggregate";
import { OTHER } from "./theme";

type StatsError = "wrongPin" | "loadError" | "";

export function useStatsData() {
  const [pin, setPin] = useState("");
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState<StatsError>("");
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const bounds = useMemo(() => {
    const dates = (payload?.tickets ?? []).map((t) => t.date).sort();
    return { min: dates[0] ?? "", max: dates[dates.length - 1] ?? "" };
  }, [payload]);

  const stats = useMemo(() => {
    if (!payload) return null;
    return compute(
      payload.tickets.filter(
        (t) =>
          (!from || t.date >= from) &&
          (!to || t.date <= to) &&
          selected.has(t.sup ?? OTHER),
      ),
    );
  }, [payload, from, to, selected]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) throw new Error(res.status === 401 ? "wrongPin" : "loadError");
      const data: Payload = await res.json();
      const dates = data.tickets.map((t) => t.date).sort();
      setFrom(dates[0] ?? "");
      setTo(dates[dates.length - 1] ?? "");
      setSelected(new Set([...data.supporters, OTHER]));
      setPayload(data);
    } catch (err) {
      setError(
        err instanceof Error && err.message === "wrongPin" ? "wrongPin" : "loadError",
      );
    } finally {
      setLoading(false);
    }
  }

  return {
    pin,
    setPin,
    payload,
    stats,
    error,
    loading,
    from,
    setFrom,
    to,
    setTo,
    selected,
    setSelected,
    bounds,
    submit,
  };
}
