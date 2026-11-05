const LEAD_OPEN = ["New", "In Progress", "Delegated"];
const LEAD_HOUR = 3600000,
  LEAD_DAY = 86400000;
const leadReport = {
  tab: "overview",
  from: "",
  to: "",
  category: "",
  workplace: "",
  reporter: "",
  supporter: "",
  status: "",
  search: "",
  supporterDetail: "",
};

const leadT = (de, en = de) => (lang === "en" ? en : de);
const leadTime = (d) => new Date(d).getTime();
const leadKey = (d) => {
  const x = new Date(d);
  return (
    x.getFullYear() +
    "-" +
    String(x.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(x.getDate()).padStart(2, "0")
  );
};
const leadIsOpen = (i) => LEAD_OPEN.includes(i.status);
const leadUnassigned = (i) => !i.assignee || i.assignee === "Nicht zugewiesen";
const leadIsSupportResolved = (i) =>
  !!(i.resolvedAt && i.resolvedBy && i.resolutionSource !== "Reporter");
const leadAvg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const leadDur = (ms) => reportDurationLabel(ms);
const leadWeekday = (key) =>
  new Date(key + "T00:00").toLocaleDateString(lang === "en" ? "en-GB" : "de-CH", {
    weekday: "short",
  });

function leadMedian(a) {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y),
    m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function leadSpan(a, b) {
  if (!a || !b) return null;
  const x = leadTime(a),
    y = leadTime(b);
  return Number.isFinite(x) && Number.isFinite(y) && y >= x ? y - x : null;
}
function leadValid(list) {
  return list.filter((x) => x != null);
}
function leadEventTime(i, pattern, last = false) {
  const hits = (i.events || []).filter((e) => pattern.test(e[0]));
  const e = last ? hits[hits.length - 1] : hits[0];
  return e ? e[2] : null;
}
function leadAssignedAt(i) {
  return i.assignedAt || leadEventTime(i, /übernommen|zugewiesen|taken over|assigned/i);
}
function leadClosedAt(i) {
  return i.status === "Closed"
    ? i.closedAt || leadEventTime(i, /geschlossen|closed/i, true)
    : null;
}
function leadShiftKey(key, days) {
  const d = new Date(key + "T00:00");
  d.setDate(d.getDate() + days);
  return leadKey(d);
}
function leadLastDays(n) {
  const out = [];
  for (let k = n - 1; k >= 0; k--) {
    const d = new Date();
    d.setDate(d.getDate() - k);
    out.push(leadKey(d));
  }
  return out;
}
function leadRangeDays(from, to) {
  const out = [];
  for (let k = from, guard = 0; k <= to && guard < 62; k = leadShiftKey(k, 1), guard++)
    out.push(k);
  return out;
}
function leadCountBy(list, keyFn): Record<string, number> {
  const m: Record<string, number> = {};
  list.forEach((i) => {
    const k = keyFn(i);
    m[k] = (m[k] || 0) + 1;
  });
  return m;
}
function leadBar(pct, cls = "") {
  return `<div class="hbar"><i class="${cls || ""}" style="width:${Math.max(0, Math.min(100, pct))}%"></i></div>`;
}
function leadRow(i, extra = "") {
  return `<tr class="incident-row" tabindex="0" role="link" onclick="openIncident('${i.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openIncident('${i.id}')}"><td class="id">${escapeHtml(i.id)}</td>${extra}</tr>`;
}

function leadTrendChart(keys, created, resolved, label) {
  const max = Math.max(
    1,
    ...keys.map((k) => Math.max(created[k] || 0, resolved[k] || 0)),
  );
  const cols = keys
    .map((k) => {
      const c = created[k] || 0,
        r = resolved[k] || 0,
        net = c - r;
      return `<div class="trendcol"><div class="trendbars"><div class="tbar created" style="height:${(c / max) * 100}%"><b>${c}</b></div><div class="tbar resolved" style="height:${(r / max) * 100}%"><b>${r}</b></div></div><span class="trendlabel">${label(k)}</span><span class="trendnet ${net > 0 ? "up" : "down"}">${net > 0 ? "+" : ""}${net}</span></div>`;
    })
    .join("");
  return `<div class="trendchart ${keys.length > 10 ? "dense" : ""}">${cols}</div><div class="trendlegend"><span><i class="created"></i>${leadT("Erstellt", "Created")}</span><span><i class="resolved"></i>${leadT("Gelöst", "Resolved")}</span><span class="sub">${leadT("Zeile darunter: Erstellt minus Gelöst (positiv = Rückstand wächst)", "Row below: created minus resolved (positive = backlog growing)")}</span></div>`;
}

function leadDashboard() {
  const now = Date.now(),
    today = leadKey(new Date());
  const open = incidents.filter(leadIsOpen);
  const newToday = incidents.filter((i) => leadKey(i.date) === today);
  const resolvedToday = incidents.filter(
    (i) => leadIsSupportResolved(i) && leadKey(i.resolvedAt) === today,
  );
  const awaiting = incidents.filter((i) => i.status === "Resolved");
  const over24 = open.filter((i) => now - leadTime(i.date) > LEAD_DAY);
  const over72 = open.filter((i) => now - leadTime(i.date) > 3 * LEAD_DAY);
  const unassigned = open.filter(leadUnassigned);
  const delegated = incidents.filter((i) => i.status === "Delegated");
  const reopened = open.filter((i) => i.reopenedCount > 0);
  const avgToday = leadAvg(
    leadValid(resolvedToday.map((i) => leadSpan(i.date, i.resolvedAt))),
  );

  const kpi = (label, value, note = "", click = "", tone = "") =>
    `<${click ? "button" : "div"} class="card kpi ${click ? "clickablemetric" : ""} ${tone || ""}" ${click ? `onclick="${click}"` : ""}><span class="kpi-label">${label}</span><span class="kpi-value">${value}</span><span class="kpi-note">${note}</span></${click ? "button" : "div"}>`;
  const small = (label, value, tone = "") =>
    `<div class="card kpi-small ${value > 0 && tone ? tone : ""}"><strong>${value}</strong><span>${label}</span></div>`;

  const kpis = `<div class="kpi-grid">${kpi(leadT("Offene Ereignisse", "Open incidents"), open.length, leadT("Aktuell ungelöst", "Currently unresolved"), "incidentListMode='open';setPage('incidents')")}${kpi(leadT("Neu heute", "New today"), newToday.length, leadT("Heute gemeldet", "Reported today"))}${kpi(leadT("Heute gelöst", "Resolved today"), resolvedToday.length, leadT("Durch Support gelöst", "Resolved by support"))}${kpi(leadT("Wartet auf Schliessung", "Awaiting closure"), awaiting.length, leadT("Gelöst, nicht geschlossen", "Resolved, not closed"), "incidentListMode='resolved';setPage('incidents')")}</div>
        <div class="kpi-small-grid">${small(leadT("Ø Lösungszeit heute", "Avg. resolution today"), avgToday == null ? "–" : leadDur(avgToday))}${small(leadT("Älter als 24 Stunden", "Older than 24 hours"), over24.length, "warn")}${small(leadT("Älter als 3 Tage", "Older than 3 days"), over72.length, "danger")}${small(leadT("Nicht zugewiesen", "Unassigned"), unassigned.length, "warn")}${small(leadT("Delegiert (Nachverfolgung)", "Delegated (follow-up)"), delegated.length)}</div>`;

  const people = supporters.map((name) => {
    const mine = open.filter((i) => i.assignee === name),
      done = resolvedToday.filter((i) => i.resolvedBy === name);
    const oldest = mine.slice().sort((a, b) => leadTime(a.date) - leadTime(b.date))[0];
    return {
      name,
      open: mine.length,
      done: done.length,
      oldest,
      avg: leadAvg(leadValid(done.map((i) => leadSpan(i.date, i.resolvedAt)))),
    };
  });
  const peak = Math.max(1, ...people.map((p) => Math.max(p.open, p.done)));
  const hi = people.reduce((a, b) => (b.open > a.open ? b : a), people[0]),
    lo = people.reduce((a, b) => (b.open < a.open ? b : a), people[0]);
  const imbalanced = hi.open - lo.open >= 3 && hi.open > lo.open * 1.5;
  const workload = `<div class="card"><div class="pagehead" style="margin-bottom:12px"><div><h2 style="margin:0">${leadT("Supporter-Auslastung", "Supporter workload")}</h2><div class="sub">${leadT("Offene Ereignisse und heute gelöste Ereignisse pro Supporter", "Open and resolved-today incidents per supporter")}</div></div><span class="badge ${unassigned.length ? "b-new" : "b-resolved"}">${leadT("Nicht zugewiesen", "Unassigned")}: ${unassigned.length}</span></div>
        <div class="workload-grid">${people.map((p) => `<div class="workload"><strong>${escapeHtml(p.name)}</strong><div class="sub">${p.open} ${leadT("offen", "open")} · ${p.done} ${leadT("heute gelöst", "resolved today")}</div>${leadBar((p.open / peak) * 100)}${leadBar((p.done / peak) * 100, "green")}<div class="workload-meta"><span>Ø ${leadT("Lösungszeit", "resolution")}: ${p.avg == null ? "–" : leadDur(p.avg)}</span><span>${leadT("Ältester offener", "Oldest open")}: ${p.oldest ? `<button class="linkbtn" onclick="openIncident('${p.oldest.id}')">${escapeHtml(p.oldest.id)}</button> · ${leadDur(now - leadTime(p.oldest.date))}` : "–"}</span></div></div>`).join("")}</div>
        <div class="trendlegend"><span><i class="created"></i>${leadT("Offen", "Open")}</span><span><i class="resolved"></i>${leadT("Heute gelöst", "Resolved today")}</span></div>
        <div class="notice ${imbalanced ? "" : "ok"}" style="margin:12px 0 0">${imbalanced ? leadT(`Ungleichgewicht: ${escapeHtml(hi.name)} hat ${hi.open} offene Ereignisse, ${escapeHtml(lo.name)} nur ${lo.open}.`, `Imbalance: ${escapeHtml(hi.name)} has ${hi.open} open incidents, ${escapeHtml(lo.name)} only ${lo.open}.`) : leadT(`Auslastung ausgeglichen (Differenz zwischen höchster und niedrigster Anzahl offener Ereignisse: ${hi.open - lo.open}).`, `Workload is balanced (difference between highest and lowest open count: ${hi.open - lo.open}).`)}</div></div>`;

  const situations = [
    {
      key: "reopened",
      label: leadT("Wiedereröffnet", "Reopened"),
      why: leadT(
        "Frühere Lösung hat evtl. nicht funktioniert",
        "Previous resolution may not have worked",
      ),
      list: reopened,
      tone: "danger",
    },
    {
      key: "over72",
      label: leadT("Länger als 3 Tage offen", "Open more than 3 days"),
      why: leadT("Erfordert Aufmerksamkeit", "Requires attention"),
      list: over72,
      tone: "danger",
    },
    {
      key: "over24",
      label: leadT("Länger als 24 Std. offen", "Open more than 24 hours"),
      why: leadT("Mögliche Verzögerung", "Potential delay"),
      list: over24,
      tone: "warn",
    },
    {
      key: "unassigned",
      label: leadT("Neu und nicht zugewiesen", "New and unassigned"),
      why: leadT(
        "Niemand hat die Verantwortung übernommen",
        "Nobody has taken ownership",
      ),
      list: unassigned,
      tone: "warn",
    },
    {
      key: "delegated",
      label: leadT("Extern delegiert", "Delegated externally"),
      why: leadT("Nachverfolgung evtl. nötig", "Follow-up may be needed"),
      list: delegated,
      tone: "",
    },
    {
      key: "awaiting",
      label: leadT("Gelöst, nicht geschlossen", "Resolved, not closed"),
      why: leadT("Schliessung steht aus", "Closure is outstanding"),
      list: awaiting,
      tone: "",
    },
  ];
  const reasons = {};
  situations.forEach((s) =>
    s.list.forEach((i) => (reasons[i.id] = reasons[i.id] || []).push(s)),
  );
  const flagged = incidents
    .filter((i) => reasons[i.id])
    .sort(
      (a, b) =>
        situations.indexOf(reasons[a.id][0]) - situations.indexOf(reasons[b.id][0]) ||
        leadTime(a.date) - leadTime(b.date),
    )
    .slice(0, 10);
  const attention = `<div class="card"><h2>${leadT("Ereignisse mit Handlungsbedarf", "Incidents requiring attention")}</h2><div class="situation-grid">${situations.map((s) => `<div class="situation ${s.list.length ? s.tone : ""}"><strong>${s.list.length}</strong><span>${s.label}</span><small>${s.why}</small></div>`).join("")}</div>
        ${flagged.length ? `<div class="tablewrap"><table><thead><tr><th>${leadT("Referenz", "Reference")}</th><th>${leadT("Situation", "Situation")}</th><th>${leadT("Beschreibung", "Description")}</th><th>${leadT("Arbeitsplatz", "Workplace")}</th><th>${leadT("Zugewiesen an", "Assigned to")}</th><th>${leadT("Alter", "Age")}</th></tr></thead><tbody>${flagged.map((i) => leadRow(i, `<td>${reasons[i.id].map((s) => `<span class="chip ${s.tone}">${s.label}</span>`).join(" ")}</td><td>${escapeHtml(i.description)}</td><td>${escapeHtml(i.workplace)}</td><td>${escapeHtml(i.assignee)}</td><td>${leadDur(now - leadTime(i.date))}</td>`)).join("")}</tbody></table></div><p class="sub" style="margin-top:10px">${leadT("Die 10 dringendsten Einträge. Klicke auf eine Zeile, um das Ereignis zu öffnen.", "The 10 most urgent entries. Click a row to open the incident.")}</p>` : `<div class="empty">${leadT("Keine Ereignisse mit Handlungsbedarf.", "No incidents require attention.")}</div>`}</div>`;

  const days = leadLastDays(7);
  const createdPerDay = leadCountBy(incidents, (i) => leadKey(i.date)),
    resolvedPerDay = leadCountBy(
      incidents.filter((i) => i.resolvedAt),
      (i) => leadKey(i.resolvedAt),
    );
  const weekCreated = days.reduce((s, k) => s + (createdPerDay[k] || 0), 0),
    weekResolved = days.reduce((s, k) => s + (resolvedPerDay[k] || 0), 0),
    diff = weekCreated - weekResolved;
  const trend = `<div class="card"><h2>${leadT("Trend: letzte 7 Tage", "Trend: last 7 days")}</h2>${leadTrendChart(days, createdPerDay, resolvedPerDay, (k) => (k === today ? leadT("Heute", "Today") : leadWeekday(k)))}<p class="sub" style="margin-top:10px">${leadT(`Letzte 7 Tage: ${weekCreated} erstellt, ${weekResolved} gelöst – ${diff > 0 ? `der Rückstand wächst um ${diff}` : diff < 0 ? `der Rückstand sinkt um ${-diff}` : "Eingang und Lösung sind ausgeglichen"}.`, `Last 7 days: ${weekCreated} created, ${weekResolved} resolved – ${diff > 0 ? `backlog is growing by ${diff}` : diff < 0 ? `backlog is shrinking by ${-diff}` : "incoming and resolved are balanced"}.`)}</p></div>`;

  return (
    head(
      "Dashboard",
      leadT(
        "Tagesübersicht · KPIs, Auslastung, kritische Ereignisse und Tagestrends",
        "Daily overview · KPIs, workload, attention-required incidents and daily trends",
      ),
    ) +
    `<div class="actionbar"><button class="btn primary" onclick="setPage('reports')">▥ ${leadT("Berichte öffnen", "Open reports")}</button><span class="actionhint">${leadT("Historische Auswertungen und Supporter-Leistung ansehen.", "Review historical reports and supporter performance.")}</span></div>` +
    kpis +
    `<div class="stack">${attention}${workload}${trend}</div>`
  );
}

const LEAD_TABS = [
  ["overview", "Ereignis-Übersicht", "Incident Overview"],
  ["supporters", "Supporter-Leistung", "Supporter Performance"],
  [
    "categories",
    "Kategorien & wiederkehrende Probleme",
    "Categories & Recurring Problems",
  ],
  ["resolution", "Lösungszeit-Analyse", "Resolution Time Analysis"],
  ["workplaces", "Arbeitsplatz-Analyse", "Workplace Analysis"],
  ["history", "Ereignis-Verlauf", "Incident History"],
];

function leadBase(i) {
  const s = leadReport;
  return (
    (!s.category || i.category === s.category) &&
    (!s.workplace || i.workplace === s.workplace) &&
    (!s.reporter || i.reporter === s.reporter) &&
    (!s.status || i.status === s.status) &&
    (!s.supporter || i.assignee === s.supporter || i.resolvedBy === s.supporter)
  );
}
function leadDataset() {
  const s = leadReport,
    base = incidents.filter(leadBase);
  const inRange = (d) => {
    if (!d) return false;
    const k = leadKey(d);
    return (!s.from || k >= s.from) && (!s.to || k <= s.to);
  };
  return {
    base,
    inRange,
    created: base.filter((i) => inRange(i.date)),
    resolved: base.filter((i) => i.resolvedAt && inRange(i.resolvedAt)),
    closed: base.filter((i) => {
      const c = leadClosedAt(i);
      return c && inRange(c);
    }),
  };
}
function leadResolutionTimes(list) {
  return leadValid(list.map((i) => leadSpan(i.date, i.resolvedAt)));
}
function leadStat(label, value, hint = "") {
  return `<div class="reportstat"><strong>${value}</strong><span>${label}</span>${hint ? `<small class="sub">${hint}</small>` : ""}</div>`;
}

function reportsPage() {
  if (!leadReport.from) {
    leadReport.to = leadKey(new Date());
    leadReport.from = leadShiftKey(leadReport.to, -29);
  }
  const s = leadReport,
    opt = (list, val) =>
      `<option value="">${leadT("Alle", "All")}</option>${list.map((x) => `<option value="${escapeHtml(x)}" ${x === val ? "selected" : ""}>${escapeHtml(x)}</option>`).join("")}`;
  const sel = (key, label, list) =>
    `<div class="field"><label>${label}</label><select onchange="leadSetFilter('${key}',this.value)">${opt(list, s[key])}</select></div>`;
  const statuses = ["New", "In Progress", "Delegated", "Resolved", "Closed"];
  return (
    head(
      leadT("Berichte", "Reports"),
      leadT(
        "Historische Analyse für die Teamleitung",
        "Historical analysis for the team leader",
      ),
      `<button class="btn" onclick="window.print()">⤓ ${leadT("Drucken / PDF", "Print / PDF")}</button>`,
    ) +
    `<div class="pilltabs report-tabs">${LEAD_TABS.map(([key, de, en]) => `<button class="${s.tab === key ? "active" : ""}" onclick="leadSetTab('${key}')">${leadT(de, en)}</button>`).join("")}</div>` +
    `<div class="card report-filters"><div class="filters-grid"><div class="field"><label>${leadT("Von", "From")}</label><input type="date" value="${s.from}" onchange="leadSetFilter('from',this.value)"></div><div class="field"><label>${leadT("Bis", "To")}</label><input type="date" value="${s.to}" onchange="leadSetFilter('to',this.value)"></div>${sel("supporter", "Supporter", supporters)}<div class="field"><label>Status</label><select onchange="leadSetFilter('status',this.value)"><option value="">${leadT("Alle", "All")}</option>${statuses.map((x) => `<option value="${x}" ${x === s.status ? "selected" : ""}>${statusDE(x)}</option>`).join("")}</select></div></div><div class="filters"><button class="btn small" onclick="setReportRange(7)">${leadT("Letzte 7 Tage", "Last 7 days")}</button><button class="btn small" onclick="setReportRange(30)">${leadT("Letzte 30 Tage", "Last 30 days")}</button><button class="btn small" onclick="leadResetFilters()">${leadT("Filter zurücksetzen", "Reset filters")}</button></div></div><div id="reportResults"></div><p class="sub" style="margin-top:14px">${leadT("Berechnet aus lokalen Demodaten; Zeiten sind verstrichene Zeit, keine aktive Arbeitszeit. Die Ergebnisse dienen der Demo und sind nicht revisionssicher.", "Calculated from local demo data; durations are elapsed time, not active working time. Results are illustrative, not audit-ready.")}</p>`
  );
}
function leadSetTab(tab) {
  leadReport.tab = tab;
  leadReport.supporterDetail = "";
  render();
}
function leadSetFilter(key, value) {
  leadReport[key] = value;
  updateReports();
}
function leadResetFilters() {
  Object.assign(leadReport, {
    from: "",
    to: "",
    category: "",
    workplace: "",
    reporter: "",
    supporter: "",
    status: "",
    search: "",
    supporterDetail: "",
  });
  render();
}
function setReportRange(days) {
  leadReport.to = leadKey(new Date());
  leadReport.from = leadShiftKey(leadReport.to, -(days - 1));
  render();
}
function leadShowSupporter(name) {
  leadReport.supporterDetail = name;
  updateReports();
}

function updateReports() {
  const el = $("#reportResults");
  if (!el) return;
  const d = leadDataset(),
    views = {
      overview: leadOverview,
      supporters: leadSupporters,
      categories: leadCategories,
      resolution: leadResolution,
      workplaces: leadWorkplaces,
      history: leadHistory,
    };
  el.innerHTML = (views[leadReport.tab] || leadOverview)(d);
}

function leadOverview(d) {
  const s = leadReport,
    open = d.base.filter(leadIsOpen),
    times = leadResolutionTimes(d.resolved);
  const carried = d.base.filter(
    (i) => leadKey(i.date) < s.from && (!i.resolvedAt || leadKey(i.resolvedAt) >= s.from),
  ).length;
  const days = leadRangeDays(s.from, s.to);
  const createdPerDay = leadCountBy(d.created, (i) => leadKey(i.date)),
    resolvedPerDay = leadCountBy(d.resolved, (i) => leadKey(i.resolvedAt));
  const statusCounts = leadCountBy(d.created, (i) => i.status);
  return `<div class="reportstats">${leadStat(leadT("Erstellt", "Created"), d.created.length, leadT("Im Zeitraum gemeldet", "Reported in period"))}${leadStat(leadT("Gelöst", "Resolved"), d.resolved.length, leadT("Im Zeitraum gelöst", "Resolved in period"))}${leadStat(leadT("Geschlossen", "Closed"), d.closed.length, leadT("Im Zeitraum geschlossen", "Closed in period"))}${leadStat(leadT("Aktuell offen", "Currently open"), open.length)}${leadStat(leadT("Noch nicht zugewiesen", "Still unassigned"), open.filter(leadUnassigned).length)}${leadStat(leadT("Ø Lösungszeit", "Avg. resolution time"), leadDur(leadAvg(times)))}${leadStat(leadT("Median Lösungszeit", "Median resolution time"), leadDur(leadMedian(times)))}${leadStat(leadT("Übertrag", "Carried over"), carried, leadT("Vor dem Zeitraum erstellt und noch nicht gelöst", "Created before the period and not yet resolved"))}</div>
        <div class="grid2" style="margin-top:16px"><div class="card"><h2>${leadT("Eingang vs. Lösung pro Tag", "Created vs. resolved per day")}</h2>${days.length <= 62 ? leadTrendChart(days, createdPerDay, resolvedPerDay, (k) => k.slice(8)) : ""}</div><div class="card"><h2>${leadT("Status der erstellten Ereignisse", "Status of created incidents")}</h2>${["New", "In Progress", "Delegated", "Resolved", "Closed"].map((st) => `<div class="detailrow"><span>${badge(st)}</span><strong>${statusCounts[st] || 0}</strong></div>`).join("")}</div></div>`;
}

function leadSupporters(d) {
  const s = leadReport,
    names = s.supporter ? [s.supporter] : supporters;
  const rows = names.map((name) => {
    const res = d.resolved.filter(
        (i) => leadIsSupportResolved(i) && i.resolvedBy === name,
      ),
      times = leadResolutionTimes(res);
    return {
      name,
      assigned: d.created.filter((i) => i.assignee === name).length,
      resolved: res.length,
      closed: d.closed.filter((i) => leadIsSupportResolved(i) && i.resolvedBy === name)
        .length,
      avg: leadAvg(times),
      median: leadMedian(times),
      longest: times.length ? Math.max(...times) : null,
      open: d.base.filter((i) => leadIsOpen(i) && i.assignee === name).length,
      reopened: d.base.reduce(
        (n, i) => n + (i.reopenedFrom || []).filter((x) => x === name).length,
        0,
      ),
      delegated: d.created.filter(
        (i) => i.delegatedTo && (i.assignee === name || i.resolvedBy === name),
      ).length,
    };
  });
  const table = `<div class="card"><h2>${leadT("Supporter-Vergleich", "Supporter comparison")}</h2><div class="tablewrap"><table><thead><tr><th>Supporter</th><th>${leadT("Zugewiesen", "Assigned")}</th><th>${leadT("Gelöst", "Resolved")}</th><th>${leadT("Geschlossen", "Closed")}</th><th>Ø ${leadT("Lösungszeit", "resolution")}</th><th>Median</th><th>${leadT("Längste", "Longest")}</th><th>${leadT("Offen", "Open")}</th><th>${leadT("Wiedereröffnet", "Reopened")}</th><th>${leadT("Delegiert", "Delegated")}</th></tr></thead><tbody>${rows.map((r) => `<tr><td><button class="linkbtn" data-name="${escapeHtml(r.name)}" onclick="leadShowSupporter(this.dataset.name)">${escapeHtml(r.name)}</button></td><td>${r.assigned}</td><td>${r.resolved}</td><td>${r.closed}</td><td>${leadDur(r.avg)}</td><td>${leadDur(r.median)}</td><td>${leadDur(r.longest)}</td><td>${r.open}</td><td>${r.reopened}</td><td>${r.delegated}</td></tr>`).join("")}</tbody></table></div><div class="notice" style="margin:14px 0 0">${leadT("Hinweis: Supporter werden bewusst nicht allein nach der Anzahl gelöster Ereignisse bewertet. Kategorien und Ereignisse unterscheiden sich stark im Aufwand. Klicke auf einen Namen, um den Verlauf zu sehen.", "Note: supporters are deliberately not ranked by resolved count alone. Categories and incidents differ greatly in effort. Click a name to see their history.")}</div></div>`;
  const who = s.supporterDetail;
  if (!who) return table;
  const mine = d.base
    .filter(
      (i) =>
        (i.assignee === who || i.resolvedBy === who) &&
        (d.inRange(i.date) || d.inRange(i.resolvedAt)),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    table +
    `<div class="card" style="margin-top:16px"><div class="pagehead" style="margin-bottom:12px"><h2 style="margin:0">${leadT("Verlauf", "History")}: ${escapeHtml(who)}</h2><button class="btn small" onclick="leadShowSupporter('')">${leadT("Schliessen", "Close")}</button></div>${leadHistoryTable(mine)}</div>`
  );
}

function leadGroupRows(list, keyFn) {
  const groups: Record<string, any[]> = {};
  list.forEach((i) => {
    const k = keyFn(i);
    if (k != null) (groups[k] = groups[k] || []).push(i);
  });
  return Object.entries(groups).map(([key, items]) => {
    const t = leadResolutionTimes(items);
    return { key, n: items.length, avg: leadAvg(t), median: leadMedian(t) };
  });
}
function leadGroupTable(title, rows) {
  const max = Math.max(1, ...rows.map((r) => r.avg || 0));
  return `<div class="card"><h2>${title}</h2>${rows.length ? `<div class="tablewrap"><table><thead><tr><th></th><th>n</th><th>Ø</th><th>Median</th><th></th></tr></thead><tbody>${rows.map((r) => `<tr><td>${escapeHtml(r.key)}</td><td>${r.n}</td><td>${leadDur(r.avg)}</td><td>${leadDur(r.median)}</td><td style="width:30%">${leadBar(((r.avg || 0) / max) * 100)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">–</div>`}</div>`;
}

function leadCategories(d) {
  const s = leadReport,
    len = leadRangeDays(s.from, s.to).length,
    prevFrom = leadShiftKey(s.from, -len),
    prevTo = leadShiftKey(s.from, -1);
  const prev = leadCountBy(
    d.base.filter((i) => {
      const k = leadKey(i.date);
      return k >= prevFrom && k <= prevTo;
    }),
    (i) => i.category,
  );
  const counts = leadCountBy(d.created, (i) => i.category),
    top = Math.max(1, ...Object.values(counts));
  const repeatsBy = (list) => {
    const g = leadCountBy(list, (i) => i.workplace + "\u0000" + i.category);
    return Object.entries(g).filter(([, n]) => n > 1);
  };
  const repeatPerCategory = {};
  repeatsBy(d.created).forEach(([k, n]) => {
    const c = k.split("\u0000")[1];
    repeatPerCategory[c] = (repeatPerCategory[c] || 0) + n - 1;
  });
  const avgBy = Object.fromEntries(
    leadGroupRows(d.resolved, (i) => i.category).map((r) => [r.key, r]),
  );
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const trendLabel = (c) => {
    const p = prev[c] || 0,
      n = counts[c];
    if (!p) return `<span class="chip warn">${leadT("neu", "new")}</span>`;
    const pct = Math.round(((n - p) / p) * 100);
    return `<span class="chip ${pct > 0 ? "warn" : ""}">${pct > 0 ? "+" : ""}${pct}%</span>`;
  };
  const slowest = Object.values(avgBy)
    .filter((r) => r.n >= 2)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);
  const recurring = repeatsBy(d.created)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const places = Object.entries(leadCountBy(d.created, (i) => i.workplace))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  return `<div class="card"><h2>${leadT("Kategorien im Zeitraum", "Categories in period")}</h2>${rows.length ? `${donutChart(rows)}<div class="tablewrap" style="margin-top:16px"><table><thead><tr><th>${leadT("Kategorie", "Category")}</th><th>${leadT("Ereignisse", "Incidents")}</th><th></th><th>${leadT("Vorperiode", "Previous period")}</th><th>${leadT("Veränderung", "Change")}</th><th>Ø ${leadT("Lösungszeit", "resolution")}</th><th>${leadT("Wiederholungen", "Repeats")}</th></tr></thead><tbody>${rows.map(([c, n]) => `<tr><td>${escapeHtml(c)}</td><td>${n}</td><td style="width:22%">${leadBar((n / top) * 100)}</td><td>${prev[c] || 0}</td><td>${trendLabel(c)}</td><td>${leadDur(avgBy[c]?.avg ?? null)}</td><td>${repeatPerCategory[c] || 0}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">${leadT("Keine Ereignisse im Zeitraum.", "No incidents in this period.")}</div>`}<p class="sub" style="margin-top:10px">${leadT(`Vorperiode: ${prevFrom} bis ${prevTo}. Wiederholung = weiteres Ereignis derselben Kategorie am selben Arbeitsplatz.`, `Previous period: ${prevFrom} to ${prevTo}. Repeat = another incident of the same category at the same workplace.`)}</p></div>
        <div class="grid2" style="margin-top:16px"><div class="card"><h2>${leadT("Wiederkehrende Probleme", "Recurring problems")}</h2>${
          recurring.length
            ? recurring
                .map(([k, n]) => {
                  const [w, c] = k.split("\u0000");
                  return `<div class="detailrow"><span>${escapeHtml(w)} — ${escapeHtml(c)}</span><strong>${n}×</strong></div>`;
                })
                .join("")
            : `<p class="sub">${leadT("Keine Wiederholungen im Zeitraum.", "No repeats in this period.")}</p>`
        }<h3 style="margin-top:18px">${leadT("Längste Lösungszeiten je Kategorie", "Longest resolution times by category")}</h3>${slowest.length ? slowest.map((r) => `<div class="detailrow"><span>${escapeHtml(r.key)} <small class="sub">(n=${r.n})</small></span><strong>${leadDur(r.avg)}</strong></div>`).join("") : `<p class="sub">–</p>`}</div><div class="card"><h2>${leadT("Arbeitsplätze mit den meisten Ereignissen", "Workplaces with most incidents")}</h2>${places.length ? places.map(([w, n]) => `<div class="detailrow"><span>${escapeHtml(w)}</span><strong>${n}</strong></div>`).join("") : `<p class="sub">–</p>`}</div></div>`;
}

function leadResolution(d) {
  const now = Date.now();
  const toAssign = leadValid(d.created.map((i) => leadSpan(i.date, leadAssignedAt(i)))),
    assignToResolve = leadValid(
      d.resolved.map((i) => leadSpan(leadAssignedAt(i), i.resolvedAt)),
    ),
    toClose = leadValid(d.closed.map((i) => leadSpan(i.resolvedAt, leadClosedAt(i)))),
    total = leadResolutionTimes(d.resolved);
  const step = (title, sub) =>
    `<div class="lifestep"><strong>${title}</strong><span>${sub}</span></div>`;
  const link = (ms, n) =>
    `<div class="lifelink"><b>${leadDur(leadAvg(ms))}</b><small>n=${n.length}</small></div>`;
  const lifecycle = `<div class="card"><h2>${leadT("Ereignis-Lebenszyklus", "Incident lifecycle")}</h2><div class="lifecycle">${step("1. " + leadT("Erstellt", "Created"), leadT("Melder erfasst Ereignis", "Reporter submits incident"))}${link(toAssign, toAssign)}${step("2. " + leadT("Zugewiesen", "Assigned"), leadT("Supporter übernimmt", "Supporter takes ownership"))}${link(assignToResolve, assignToResolve)}${step("3. " + leadT("Gelöst", "Resolved"), leadT("Problem behoben", "Issue solved"))}${link(toClose, toClose)}${step("4. " + leadT("Geschlossen", "Closed"), leadT("Formal abgeschlossen", "Formally completed"))}</div><p class="sub" style="margin-top:12px">${leadT(`Ø Erstellung bis Lösung: ${leadDur(leadAvg(total))} (n=${total.length}). Die Zuweisungszeit wird erst bei neu bearbeiteten Ereignissen erfasst; ältere Demodaten enthalten keinen Zuweisungszeitpunkt.`, `Avg. creation to resolution: ${leadDur(leadAvg(total))} (n=${total.length}). Assignment time is only recorded for newly handled incidents; older demo data has no assignment timestamp.`)}</p></div>`;
  const order = ["Niedrig", "Mittel", "Hoch"],
    dayOrder = [1, 2, 3, 4, 5, 6, 0];
  const dayNames = {
    0: leadT("Sonntag", "Sunday"),
    1: leadT("Montag", "Monday"),
    2: leadT("Dienstag", "Tuesday"),
    3: leadT("Mittwoch", "Wednesday"),
    4: leadT("Donnerstag", "Thursday"),
    5: leadT("Freitag", "Friday"),
    6: leadT("Samstag", "Saturday"),
  };
  const bands = ["00–06", "06–12", "12–18", "18–24"],
    band = (i) => bands[Math.floor(new Date(i.date).getHours() / 6)];
  const sortBy = (rows, list) =>
    rows.sort((a, b) => list.indexOf(a.key) - list.indexOf(b.key));
  const supportRes = d.resolved.filter(leadIsSupportResolved);
  const longest = d.base
    .filter(leadIsOpen)
    .sort((a, b) => leadTime(a.date) - leadTime(b.date))
    .slice(0, 5);
  return (
    lifecycle +
    `<div class="grid2" style="margin-top:16px">${leadGroupTable(
      leadT("Nach Supporter", "By supporter"),
      leadGroupRows(supportRes, (i) => i.resolvedBy).sort((a, b) =>
        a.key.localeCompare(b.key),
      ),
    )}${leadGroupTable(
      leadT("Nach Kategorie", "By category"),
      leadGroupRows(d.resolved, (i) => i.category).sort((a, b) => b.n - a.n),
    )}${leadGroupTable(
      leadT("Nach Arbeitsplatz (Top 10)", "By workplace (top 10)"),
      leadGroupRows(d.resolved, (i) => i.workplace)
        .sort((a, b) => b.n - a.n)
        .slice(0, 10),
    )}${leadGroupTable(
      leadT("Nach Priorität", "By priority"),
      sortBy(
        leadGroupRows(d.resolved, (i) => i.priority),
        order,
      ),
    )}${leadGroupTable(
      leadT("Nach Wochentag (Erstellung)", "By weekday (created)"),
      leadGroupRows(d.resolved, (i) => new Date(i.date).getDay())
        .sort((a, b) => dayOrder.indexOf(+a.key) - dayOrder.indexOf(+b.key))
        .map((r) => ({ ...r, key: dayNames[r.key] })),
    )}${leadGroupTable(leadT("Nach Tageszeit (Erstellung)", "By time of day (created)"), sortBy(leadGroupRows(d.resolved, band), bands))}</div>
        <div class="card" style="margin-top:16px"><h2>${leadT("Am längsten ungelöste Ereignisse", "Longest unresolved incidents")}</h2>${longest.length ? `<div class="tablewrap"><table><thead><tr><th>${leadT("Referenz", "Reference")}</th><th>${leadT("Beschreibung", "Description")}</th><th>${leadT("Arbeitsplatz", "Workplace")}</th><th>${leadT("Zugewiesen an", "Assigned to")}</th><th>Status</th><th>${leadT("Alter", "Age")}</th></tr></thead><tbody>${longest.map((i) => leadRow(i, `<td>${escapeHtml(i.description)}</td><td>${escapeHtml(i.workplace)}</td><td>${escapeHtml(i.assignee)}</td><td>${badge(i.status)}</td><td>${leadDur(now - leadTime(i.date))}</td>`)).join("")}</tbody></table></div>` : `<div class="empty">${leadT("Keine offenen Ereignisse.", "No open incidents.")}</div>`}</div>`
  );
}

function leadWorkplaces(d) {
  const groups: Record<string, any[]> = {};
  d.created.forEach((i) => (groups[i.workplace] = groups[i.workplace] || []).push(i));
  const openNow = leadCountBy(d.base.filter(leadIsOpen), (i) => i.workplace);
  const rows = Object.entries(groups)
    .map(([w, items]) => {
      const cats = Object.entries(leadCountBy(items, (i) => i.category)).sort(
        (a, b) => b[1] - a[1],
      );
      const repeats = cats.reduce((n, [, c]) => n + c - 1, 0);
      const times = leadResolutionTimes(d.resolved.filter((i) => i.workplace === w));
      return {
        w,
        n: items.length,
        topCat: cats[0],
        avg: leadAvg(times),
        repeats,
        open: openNow[w] || 0,
      };
    })
    .sort((a, b) => b.n - a.n);
  const top = Math.max(1, ...rows.map((r) => r.n));
  return `<div class="card"><h2>${leadT("Ereignisse pro Arbeitsplatz", "Incidents per workplace")}</h2>${
    rows.length
      ? `<div class="tablewrap"><table><thead><tr><th>${leadT("Arbeitsplatz", "Workplace")}</th><th>${leadT("Ereignisse", "Incidents")}</th><th></th><th>${leadT("Häufigstes Problem", "Most common issue")}</th><th>Ø ${leadT("Lösungszeit", "resolution")}</th><th>${leadT("Wiederholungen", "Repeats")}</th><th>${leadT("Offen", "Open")}</th></tr></thead><tbody>${rows
          .slice(0, 25)
          .map(
            (r) =>
              `<tr><td>${escapeHtml(r.w)}</td><td>${r.n}</td><td style="width:18%">${leadBar((r.n / top) * 100)}</td><td>${escapeHtml(r.topCat[0])} (${r.topCat[1]})</td><td>${leadDur(r.avg)}</td><td>${r.repeats}</td><td>${r.open}</td></tr>`,
          )
          .join(
            "",
          )}</tbody></table></div><p class="sub" style="margin-top:10px">${leadT(`${Math.min(25, rows.length)} von ${rows.length} Arbeitsplätzen angezeigt, sortiert nach Anzahl Ereignisse. Wiederholung = weiteres Ereignis derselben Kategorie am selben Arbeitsplatz.`, `Showing ${Math.min(25, rows.length)} of ${rows.length} workplaces, sorted by incident count. Repeat = another incident of the same category at the same workplace.`)}</p>`
      : `<div class="empty">${leadT("Keine Ereignisse im Zeitraum.", "No incidents in this period.")}</div>`
  }</div>`;
}

function leadHistoryTable(list) {
  const h = (de, en) => `<th>${leadT(de, en)}</th>`;
  if (!list.length)
    return `<div class="empty">${leadT("Keine Ereignisse gefunden.", "No incidents found.")}</div>`;
  return `<div class="tablewrap"><table><thead><tr>${h("Referenz", "Reference")}${h("Erstellt", "Created")}${h("Arbeitsplatz", "Workplace")}${h("Kategorie", "Category")}${h("Melder", "Reporter")}<th>Supporter</th><th>Status</th>${h("Zeit bis Zuweisung", "Time to assign")}${h("Lösungszeit", "Resolution time")}${h("Zeit bis Schliessung", "Time to close")}</tr></thead><tbody>${list
    .slice(0, 200)
    .map((i) =>
      leadRow(
        i,
        `<td>${fmt(i.date)}</td><td>${escapeHtml(i.workplace)}</td><td>${escapeHtml(i.category)}</td><td>${escapeHtml(i.reporter)}</td><td>${escapeHtml(i.resolvedBy || i.assignee)}</td><td>${badge(i.status)}${i.reopenedCount ? ` <span class="chip danger">↺ ${i.reopenedCount}</span>` : ""}</td><td>${leadDur(leadSpan(i.date, leadAssignedAt(i)))}</td><td>${leadDur(leadSpan(i.date, i.resolvedAt))}</td><td>${leadDur(leadSpan(i.date, leadClosedAt(i)))}</td>`,
      ),
    )
    .join(
      "",
    )}</tbody></table></div>${list.length > 200 ? `<p class="sub" style="margin-top:10px">${leadT(`Die ersten 200 von ${list.length} angezeigt – der CSV-Export enthält alle.`, `Showing the first 200 of ${list.length} – the CSV export contains all.`)}</p>` : ""}`;
}
function leadHistoryList() {
  const q = leadReport.search.toLowerCase(),
    d = leadDataset();
  return d.created
    .filter(
      (i) =>
        !q ||
        [
          i.id,
          i.description,
          i.workplace,
          i.category,
          i.reporter,
          i.assignee,
          i.resolvedBy,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}
function leadHistory() {
  const list = leadHistoryList();
  return `<div class="card"><div class="pagehead" style="margin-bottom:12px"><h2 style="margin:0">${leadT("Detaillierter Ereignis-Verlauf", "Detailed incident history")}</h2><button class="btn" onclick="leadExportCsv()">⤓ CSV</button></div><div class="filters"><input id="leadSearch" value="${escapeHtml(leadReport.search)}" placeholder="${leadT("Suchen …", "Search …")}" oninput="leadSearchHistory(this.value)" style="min-width:260px"></div><div id="leadHistoryList">${leadHistoryTable(list)}</div></div>`;
}
function leadSearchHistory(value) {
  leadReport.search = value;
  const el = $("#leadHistoryList");
  if (el) el.innerHTML = leadHistoryTable(leadHistoryList());
}
function leadExportCsv() {
  const mins = (ms) => (ms == null ? "" : Math.round(ms / 60000));
  const header = [
    "Ereignis ID",
    "Created",
    "Workplace",
    "Category",
    "Reporter",
    "Supporter",
    "Status",
    "Time to assign (min)",
    "Resolution time (min)",
    "Time to close (min)",
  ];
  const rows = leadHistoryList().map((i) => [
    i.id,
    String(i.date).replace("T", " "),
    i.workplace,
    i.category,
    i.reporter,
    i.resolvedBy || i.assignee,
    i.status,
    mins(leadSpan(i.date, leadAssignedAt(i))),
    mins(leadSpan(i.date, i.resolvedAt)),
    mins(leadSpan(i.date, leadClosedAt(i))),
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(
    new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }),
  );
  link.download = `incident-history_${leadReport.from}_${leadReport.to}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}
