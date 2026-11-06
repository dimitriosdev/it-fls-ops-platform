"use client";

import { useMemo, useState } from "react";
import { compute } from "./aggregate";
import type { Payload } from "./aggregate";
import { OTHER } from "./theme";

export function useStatsData(payload: Payload) {
  const dates = useMemo(() => payload.tickets.map((t) => t.date).sort(), [payload]);
  const [from, setFrom] = useState(dates[0] ?? "");
  const [to, setTo] = useState(dates[dates.length - 1] ?? "");
  const [selected, setSelected] = useState<Set<string>>(
    new Set([...payload.supporters, OTHER]),
  );

  const bounds = useMemo(
    () => ({ min: dates[0] ?? "", max: dates[dates.length - 1] ?? "" }),
    [dates],
  );

  const stats = useMemo(
    () =>
      compute(
        payload.tickets.filter(
          (t) =>
            (!from || t.date >= from) &&
            (!to || t.date <= to) &&
            selected.has(t.sup ?? OTHER),
        ),
      ),
    [payload, from, to, selected],
  );

  return { payload, stats, from, setFrom, to, setTo, selected, setSelected, bounds };
}
