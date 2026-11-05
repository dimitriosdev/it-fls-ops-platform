function dashboard() {
  if (currentRole === "reporter") {
    const mine = incidents.filter((i) => i.reporter === currentUser),
      active = mine.filter((i) => i.status !== "Closed"),
      closed = mine.filter((i) => i.status === "Closed");
    const closedCats = categories
      .map((c) => [c, closed.filter((i) => i.category === c).length])
      .filter((x) => x[1] > 0)
      .sort((a, b) => b[1] - a[1]);
    const maxClosed = Math.max(1, ...closedCats.map((x) => x[1]));
    return (
      head(
        lang === "en" ? "My Dashboard" : "Mein Dashboard",
        lang === "en"
          ? "Your reported incidents and their current status."
          : "Deine gemeldeten Ereignisse und ihr aktueller Status.",
        `<select class="rolepicker" onchange="chooseReporter(this.value)">${reporters.map((r) => `<option ${r === currentUser ? "selected" : ""}>${r}</option>`).join("")}</select>`,
      ) +
      `<div class="actionbar"><button class="btn primary" onclick="setPage('new')">＋ ${lang === "en" ? "New incident" : "Neues Ereignis"}</button><span class="actionhint">${lang === "en" ? "Something not working? Report a new problem." : "Etwas funktioniert nicht? Melde ein neues Problem."}</span></div><div class="cards">${metric(lang === "en" ? "Not closed" : "Offene Ereignisse", active.length, lang === "en" ? "Your active list" : "Deine aktive Liste", "◷")}${metric(lang === "en" ? "Closed incidents" : "Geschlossene Ereignisse", closed.length, lang === "en" ? "All closed reports" : "Alle geschlossenen Meldungen", "✓")}</div><div class="card"><div class="pagehead"><h2>${lang === "en" ? "My open / active incidents" : "Meine offenen / aktiven Ereignisse"}</h2></div>${tableRows(active)}</div><div class="card" style="margin-top:16px"><h2>${lang === "en" ? "Closed incidents by category" : "Geschlossene Ereignisse nach Kategorie"}</h2>${closedCats.length ? donutChart(closedCats) : lang === "en" ? "No closed incidents yet." : "Noch keine geschlossenen Ereignisse."}</div>`
    );
  }
  if (currentRole === "supporter") {
    const open = incidents.filter((i) =>
      ["New", "In Progress", "Delegated"].includes(i.status),
    );
    const today = dateKey(new Date()),
      start = new Date();
    start.setDate(start.getDate() - start.getDay() + 1);
    start.setHours(0, 0, 0, 0);
    const weekStart = dateKey(start);
    const resolved = incidents.filter(
      (i) => i.resolutionSource !== "Reporter" && i.resolvedBy && i.resolvedAt,
    );
    const todayCount = resolved.filter((i) => dateKey(i.resolvedAt) === today).length;
    const weekCount = resolved.filter(
      (i) => dateKey(i.resolvedAt) >= weekStart && dateKey(i.resolvedAt) <= today,
    ).length;
    return (
      head(
        lang === "en" ? "Support Dashboard" : "Support-Dashboard",
        lang === "en"
          ? "Open workload and direct Support resolutions."
          : "Offene Arbeit und direkte Lösungen durch Support.",
        "",
      ) +
      `<div class="actionbar"><button class="btn primary" onclick="incidentListMode='open';setPage('incidents')">▤ ${lang === "en" ? "Tickets list" : "Ereignisliste öffnen"} (${open.length})</button><span class="actionhint">${lang === "en" ? "See all open tickets and pick one up." : "Alle offenen Ereignisse ansehen und eines übernehmen."}</span></div><div class="cards">${metric(lang === "en" ? "Resolved today" : "Heute gelöst", todayCount, lang === "en" ? "Directly by Support" : "Direkt durch Support", "✓")}${metric(lang === "en" ? "Resolved this week" : "Diese Woche gelöst", weekCount, lang === "en" ? "Directly by Support" : "Direkt durch Support", "✓")}</div><div class="card" style="margin-top:16px"><h2>${lang === "en" ? "New incidents" : "Neue Ereignisse"}</h2>${tableRows(incidents.filter((i) => i.status === "New"))}</div>`
    );
  }
  return leadDashboard();
}

function updateRangeCount() {
  const a = $("#rangeFrom")?.value,
    b = $("#rangeTo")?.value;
  const count = incidents.filter(
    (i) =>
      i.resolutionSource !== "Reporter" &&
      i.resolvedBy &&
      i.resolvedAt &&
      (!a || dateKey(i.resolvedAt) >= a) &&
      (!b || dateKey(i.resolvedAt) <= b),
  ).length;
  const el = $("#rangeCount");
  if (el) el.textContent = count;
}
