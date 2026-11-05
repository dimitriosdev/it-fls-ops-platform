"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { compute } from "./aggregate";
import type { Item, Payload, Stats } from "./aggregate";
import { DICT } from "./i18n";
import type { Lang } from "./i18n";

const LangContext = createContext<Lang>("de");
const useT = () => DICT[useContext(LangContext)];

const OTHER = "__other__";

const PALETTE = [
  "#ff603f",
  "#3195ee",
  "#13b981",
  "#8b5cf6",
  "#f5a524",
  "#e5487f",
  "#14b8c4",
  "#708096",
];
const INK = "#192b40";
const MUTED = "#708096";
const LINE = "#dfe5e9";
const fmt = (n: number) => n.toLocaleString("de-CH");

function Card({
  title,
  children,
  wide,
}: {
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <section
      style={{
        background: "#fff",
        border: `1px solid ${LINE}`,
        borderRadius: 12,
        padding: 16,
        gridColumn: wide ? "1 / -1" : undefined,
        minWidth: 0,
      }}
    >
      <h3 style={{ margin: "0 0 12px", fontSize: 15, color: INK }}>{title}</h3>
      {children}
    </section>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 20, color: INK, margin: "0 0 12px" }}>{title}</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 16,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function HBar({
  data,
  color = PALETTE[1],
  unit = "",
}: {
  data: Item[];
  color?: string;
  unit?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ display: "grid", gap: 6 }}>
      {data.map((d) => (
        <div
          key={d.label}
          style={{
            display: "grid",
            gridTemplateColumns: "130px 1fr 56px",
            gap: 8,
            alignItems: "center",
            fontSize: 12,
          }}
        >
          <span
            style={{
              color: INK,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={d.label}
          >
            {d.label}
          </span>
          <div style={{ background: "#eef2f4", borderRadius: 4, height: 14 }}>
            <div
              style={{
                width: `${(d.value / max) * 100}%`,
                background: color,
                height: "100%",
                borderRadius: 4,
              }}
            />
          </div>
          <span style={{ color: MUTED, textAlign: "right" }}>
            {fmt(d.value)}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

function Columns({ data, color = PALETTE[0] }: { data: Item[]; color?: string }) {
  const W = 500;
  const H = 200;
  const pad = 24;
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = (W - pad) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} style={{ width: "100%" }}>
      {data.map((d, i) => {
        const h = (d.value / max) * (H - 20);
        const x = pad + i * bw;
        return (
          <g key={d.label}>
            <rect x={x + 4} y={H - h} width={bw - 8} height={h} fill={color} rx={3} />
            <text
              x={x + bw / 2}
              y={H - h - 4}
              fontSize={10}
              textAnchor="middle"
              fill={INK}
            >
              {fmt(d.value)}
            </text>
            <text
              x={x + bw / 2}
              y={H + 14}
              fontSize={10}
              textAnchor="middle"
              fill={MUTED}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Donut({ data }: { data: Item[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = 60;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <svg viewBox="0 0 160 160" style={{ width: 160, height: 160 }}>
        <g transform="rotate(-90 80 80)">
          {data.map((d, i) => {
            const len = (d.value / total) * c;
            const el = (
              <circle
                key={d.label}
                cx={80}
                cy={80}
                r={r}
                fill="none"
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth={26}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </g>
        <text x={80} y={85} textAnchor="middle" fontSize={18} fontWeight={700} fill={INK}>
          {fmt(total)}
        </text>
      </svg>
      <div style={{ display: "grid", gap: 4, fontSize: 12 }}>
        {data.map((d, i) => (
          <span
            key={d.label}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, color: INK }}
          >
            <i
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: PALETTE[i % PALETTE.length],
              }}
            />
            {d.label}: {fmt(d.value)} ({Math.round((d.value / total) * 100)}%)
          </span>
        ))}
      </div>
    </div>
  );
}

function LineChart({ data }: { data: Item[] }) {
  const W = 500;
  const H = 180;
  const max = Math.max(1, ...data.map((d) => d.value));
  const pts = data.map(
    (d, i) =>
      `${(i / Math.max(1, data.length - 1)) * W},${H - (d.value / max) * (H - 10)}`,
  );
  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: "100%" }}>
      <polyline
        points={`0,${H} ${pts.join(" ")} ${W},${H}`}
        fill="#3195ee22"
        stroke="none"
      />
      <polyline points={pts.join(" ")} fill="none" stroke={PALETTE[1]} strokeWidth={2} />
      <text x={0} y={H + 14} fontSize={10} fill={MUTED}>
        {data[0]?.label}
      </text>
      <text x={W} y={H + 14} fontSize={10} fill={MUTED} textAnchor="end">
        {data[data.length - 1]?.label} · {fmt(max)}
      </text>
    </svg>
  );
}

function Heatmap({ days, data }: { days: string[]; data: number[][] }) {
  const max = Math.max(1, ...data.flat());
  const cw = 20;
  return (
    <svg
      viewBox={`0 0 ${40 + 24 * cw} ${days.length * cw + 20}`}
      style={{ width: "100%" }}
    >
      {days.map((d, y) => (
        <g key={d}>
          <text x={0} y={y * cw + 14} fontSize={10} fill={MUTED}>
            {d}
          </text>
          {data[y].map((v, x) => (
            <rect
              key={x}
              x={40 + x * cw}
              y={y * cw}
              width={cw - 2}
              height={cw - 2}
              rx={3}
              fill="#ff603f"
              opacity={v ? 0.12 + 0.88 * (v / max) : 0.04}
            >
              <title>{`${d} ${x}:00 — ${v}`}</title>
            </rect>
          ))}
        </g>
      ))}
      {Array.from({ length: 8 }, (_, i) => i * 3).map((h) => (
        <text
          key={h}
          x={40 + h * cw + 8}
          y={days.length * cw + 12}
          fontSize={9}
          fill={MUTED}
          textAnchor="middle"
        >
          {h}h
        </text>
      ))}
    </svg>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${LINE}`,
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div style={{ fontSize: 12, color: MUTED }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: INK }}>{value}</div>
    </div>
  );
}

function Filters({
  payload,
  bounds,
  from,
  to,
  selected,
  onFrom,
  onTo,
  onSelected,
}: {
  payload: Payload;
  bounds: { min: string; max: string };
  from: string;
  to: string;
  selected: Set<string>;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onSelected: (s: Set<string>) => void;
}) {
  const t = useT();
  const options = payload.supporters;
  const toggle = (k: string) => {
    const next = new Set(selected);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    onSelected(next);
  };
  const input = {
    padding: 6,
    border: `1px solid ${LINE}`,
    borderRadius: 6,
    fontSize: 13,
  };
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${LINE}`,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        display: "grid",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          fontSize: 13,
          color: MUTED,
        }}
      >
        <label>
          {t.from}{" "}
          <input
            type="date"
            style={input}
            value={from}
            min={bounds.min}
            max={to || bounds.max}
            onChange={(e) => onFrom(e.target.value)}
          />
        </label>
        <label>
          {t.to}{" "}
          <input
            type="date"
            style={input}
            value={to}
            min={from || bounds.min}
            max={bounds.max}
            onChange={(e) => onTo(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            onFrom(bounds.min);
            onTo(bounds.max);
            onSelected(new Set([...options, OTHER]));
          }}
          style={{ ...input, background: "#f4f6f7", cursor: "pointer" }}
        >
          {t.reset}
        </button>
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          fontSize: 13,
        }}
      >
        <span style={{ color: MUTED }}>{t.resolvedBy}</span>
        {options.map((o) => {
          const on = selected.has(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              style={{
                padding: "4px 12px",
                borderRadius: 999,
                border: `1px solid ${on ? "#ff603f" : LINE}`,
                background: on ? "#ff603f" : "#fff",
                color: on ? "#fff" : INK,
                cursor: "pointer",
              }}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Dashboard({ s }: { s: Stats }) {
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

function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div style={{ display: "inline-flex", gap: 4 }}>
      {(["de", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          aria-pressed={lang === l}
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            border: `1px solid ${lang === l ? "#ff603f" : LINE}`,
            background: lang === l ? "#ff603f" : "#fff",
            color: lang === l ? "#fff" : INK,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default function StatsPage(): React.JSX.Element {
  const [lang, setLang] = useState<Lang>("de");
  useEffect(() => {
    const saved = window.localStorage.getItem("stats-lang");
    if (saved === "de" || saved === "en") setLang(saved);
  }, []);
  const changeLang = (l: Lang) => {
    setLang(l);
    window.localStorage.setItem("stats-lang", l);
  };
  const t = DICT[lang];

  const [pin, setPin] = useState("");
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState("");
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

  if (!payload || !stats) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f4f6f7",
        }}
      >
        <form
          onSubmit={submit}
          style={{
            background: "#fff",
            padding: 32,
            borderRadius: 12,
            border: `1px solid ${LINE}`,
            display: "grid",
            gap: 12,
            width: 300,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h1 style={{ margin: 0, fontSize: 20, color: INK }}>{t.statistics}</h1>
            <LangToggle lang={lang} onChange={changeLang} />
          </div>
          <label style={{ fontSize: 13, color: MUTED }} htmlFor="pin">
            {t.enterPin}
          </label>
          <input
            id="pin"
            type="password"
            autoFocus
            autoComplete="off"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={{
              padding: 10,
              border: `1px solid ${LINE}`,
              borderRadius: 8,
              fontSize: 16,
            }}
          />
          {error && (
            <div style={{ color: "#d92d20", fontSize: 13 }}>
              {error === "wrongPin" ? t.wrongPin : t.loadError}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !pin}
            style={{
              padding: 10,
              border: 0,
              borderRadius: 8,
              background: "#ff603f",
              color: "#fff",
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            {loading ? t.checking : t.unlock}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main style={{ background: "#f4f6f7", minHeight: "100vh", padding: "24px 20px" }}>
      <LangContext.Provider value={lang}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <h1 style={{ color: INK, margin: 0 }}>{t.title}</h1>
            <LangToggle lang={lang} onChange={changeLang} />
          </div>
          <Filters
            payload={payload}
            bounds={bounds}
            from={from}
            to={to}
            selected={selected}
            onFrom={setFrom}
            onTo={setTo}
            onSelected={setSelected}
          />
          <Dashboard s={stats} />
        </div>
      </LangContext.Provider>
    </main>
  );
}
