const DONUT_COLORS = [
  "#f4775d",
  "#3195ee",
  "#13b981",
  "#8b5cf6",
  "#f5a524",
  "#14b8c4",
  "#e5484d",
  "#7a8aa0",
  "#a3c93a",
  "#d946a8",
  "#6366f1",
  "#84cc16",
];

function badge(s) {
  return `<span class="badge ${statusClass(s)}">${statusDE(s)}</span>`;
}

function head(title, sub, button = "", back = "", backLabel = "") {
  if (back && currentRole === "reporter") {
    back = "setPage('dashboard')";
    backLabel = "Dashboard";
  }
  return `${back ? `<a class="backlink" href="#" onclick="event.preventDefault();${back}">← ${backLabel || (lang === "en" ? "Incidents" : "Ereignisse")}</a>` : ""}<div class="pagehead"><div><h1>${title}</h1><div class="sub">${sub || ""}</div></div>${button}</div>`;
}

function metric(label, val, note, icon) {
  return `<div class="card"><div class="metric-label">${icon || "●"} &nbsp;${label}</div><div class="metric">${val}</div><div class="trend">${note || ""}</div></div>`;
}

function chartBars(labels, vals) {
  let max = Math.max(...vals, 1);
  return `<div class="bars">${labels.map((l, i) => `<div class="barcol"><div class="bar" style="height:${Math.max(8, (vals[i] / max) * 130)}px"><b>${vals[i]}</b></div><span>${l}</span></div>`).join("")}</div>`;
}

function donutChart(rows) {
  const total = rows.reduce((s, r) => s + r[1], 0);
  let acc = 0;
  const stops = rows
    .map((r, n) => {
      const from = (acc / total) * 100;
      acc += r[1];
      return (
        DONUT_COLORS[n % DONUT_COLORS.length] +
        " " +
        from.toFixed(2) +
        "% " +
        ((acc / total) * 100).toFixed(2) +
        "%"
      );
    })
    .join(", ");
  const legend = rows
    .map(
      (r, n) =>
        '<li><i style="background:' +
        DONUT_COLORS[n % DONUT_COLORS.length] +
        '"></i><span>' +
        escapeHtml(r[0]) +
        "</span><strong>" +
        r[1] +
        "</strong><small>" +
        Math.round((r[1] / total) * 100) +
        "%</small></li>",
    )
    .join("");
  return (
    '<div class="donutwrap"><div class="donut" style="background:conic-gradient(' +
    stops +
    ')" role="img" aria-label="' +
    (lang === "en" ? "Incidents by category" : "Ereignisse nach Kategorie") +
    '"><div><strong>' +
    total +
    "</strong><span>" +
    (lang === "en" ? "total" : "gesamt") +
    '</span></div></div><ul class="donutlegend">' +
    legend +
    "</ul></div>"
  );
}
