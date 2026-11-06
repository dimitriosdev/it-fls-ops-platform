"use client";

import type { Item, Stats } from "../aggregate";
import { useT } from "../LangContext";
import { MUTED, PALETTE, fmt } from "../theme";
import { Columns } from "./charts/Columns";
import { Donut } from "./charts/Donut";
import { HBar } from "./charts/HBar";
import { Heatmap } from "./charts/Heatmap";
import { LineChart } from "./charts/LineChart";
import { Card, Kpi, Section } from "./Panels";

export function Dashboard({ s }: { s: Stats }) {
  const t = useT();
  const k = s.kpis;
  const tr = (items: Item[]) =>
    items.map((i) => ({ ...i, label: t.labels[i.label] ?? i.label }));
  return (
    <>
      <p style={{ color: MUTED, marginTop: 0 }}>
        {s.range.from} → {s.range.to}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 12,
          marginBottom: 32,
        }}
      >
        <Kpi label={t.totalTickets} value={fmt(k.total)} />
        <Kpi label={t.totalSupportTime} value={`${fmt(k.totalHours)} ${t.hoursUnit}`} />
        <Kpi label={t.ticketsPerDay} value={String(k.avgPerDay)} />
      </div>

      <Section title={t.secTimeTrends}>
        <Card title={t.ticketsPerMonth}>
          <Columns data={s.perMonth.map((d) => ({ ...d, label: d.label.slice(5) }))} />
        </Card>
        <Card title={t.cumulative}>
          <LineChart data={s.cumulative} />
        </Card>
        <Card title={t.heatmap} wide>
          <Heatmap days={t.days} data={s.heatmap.data} />
        </Card>
      </Section>

      <Section title={t.secDevices}>
        <Card title={t.deviceCategory}>
          <Donut data={s.deviceCategories} />
        </Card>
        <Card title={t.topDevices}>
          <HBar data={tr(s.deviceNames)} color={PALETTE[0]} />
        </Card>
      </Section>

      <Section title={t.secLocation}>
        <Card title={t.productionLine}>
          <HBar data={s.lines} color={PALETTE[2]} />
        </Card>
        <Card title={t.department}>
          <Donut data={s.departments} />
        </Card>
        <Card title={t.role}>
          <HBar data={s.roles} color={PALETTE[4]} />
        </Card>
      </Section>

      <Section title={t.secPeople}>
        <Card title={t.topReporters}>
          <HBar data={s.reporters} />
        </Card>
        <Card title={t.resolvedBySupporter}>
          <HBar data={s.resolvers} color={PALETTE[2]} />
        </Card>
        <Card title={t.avgPerSupporter}>
          <HBar data={s.resolverAvgMinutes} color={PALETTE[4]} unit={` ${t.minUnit}`} />
        </Card>
      </Section>

      <Section title={t.secResolution}>
        <Card title={t.distribution}>
          <Columns data={s.histogram} color={PALETTE[3]} />
        </Card>
        <Card title={t.medianByCategory}>
          <HBar data={tr(s.medianByCategory)} color={PALETTE[6]} unit={` ${t.minUnit}`} />
        </Card>
        <Card title={t.docVsEst}>
          <Donut data={tr(s.timeSource)} />
        </Card>
      </Section>

      <Section title={t.secQuality}>
        <Card title={t.locIdent}>
          <Donut data={tr(s.locationStatus)} />
        </Card>
        <Card title={t.supportMatch}>
          <Donut data={tr(s.matchStatus)} />
        </Card>
      </Section>
    </>
  );
}
