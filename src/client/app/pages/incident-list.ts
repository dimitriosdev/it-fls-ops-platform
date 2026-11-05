function sortHead(key, label) {
  const on = tableSort.key === key;
  return `<th class="sortable ${on ? "sorted" : ""}" tabindex="0" role="columnheader" aria-sort="${on ? (tableSort.dir > 0 ? "ascending" : "descending") : "none"}" onclick="sortTable('${key}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();sortTable('${key}')}">${label}<span class="sortarrow">${on ? (tableSort.dir > 0 ? "▲" : "▼") : "↕"}</span></th>`;
}

function sortTable(key) {
  tableSort = tableSort.key === key ? { key, dir: -tableSort.dir } : { key, dir: 1 };
  if ($("#incidenttable")) filterTable();
  else render();
}

function sortedList(list) {
  const k = tableSort.key;
  if (!k) return list;
  const val = (i) =>
    k === "id"
      ? Number(String(i.id).replace(/\D/g, ""))
      : k === "date"
        ? String(i.date)
        : String(i[k] || "").toLowerCase();
  return [...list].sort((a, b) => {
    const x = val(a),
      y = val(b);
    return (x < y ? -1 : x > y ? 1 : 0) * tableSort.dir;
  });
}

function tableRows(list) {
  if (!list.length)
    return `<div class="empty">${lang === "en" ? "No incidents found." : "Keine Ereignisse gefunden."}</div>`;
  list = sortedList(list);
  const en = lang === "en";
  return `<div class="tablewrap"><table><thead><tr>${sortHead("date", en ? "Created" : "Erstellt")}${sortHead("description", en ? "Description" : "Beschreibung")}${sortHead("workplace", en ? "Workplace" : "Arbeitsplatz")}${sortHead("category", en ? "Category" : "Kategorie")}${sortHead("status", "Status")}${sortHead("assignee", en ? "Assigned to" : "Zugewiesen an")}</tr></thead><tbody>${list.map((i) => `<tr class="incident-row" tabindex="0" role="link" aria-label="${lang === "en" ? "Open incident" : "Ereignis öffnen"} ${escapeHtml(i.id)}" onclick="openIncident('${i.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openIncident('${i.id}')}" title="${lang === "en" ? "Open incident details" : "Ereignisdetails öffnen"}"><td>${fmt(i.date)}</td><td>${escapeHtml(i.description)}</td><td>${escapeHtml(i.workplace)}</td><td>${escapeHtml(i.category)}</td><td>${badge(i.status)}</td><td>${escapeHtml(i.assignee)}</td></tr>`).join("")}</tbody></table></div>`;
}

function incidentList() {
  const createBar =
    currentRole === "reporter"
      ? `<div class="actionbar"><button class="btn primary" onclick="setPage('new')">＋ ${lang === "en" ? "New incident" : "Neues Ereignis"}</button><span class="actionhint">${lang === "en" ? "Something not working? Report a new problem." : "Etwas funktioniert nicht? Melde ein neues Problem."}</span></div>`
      : "";
  const tabs = [
    ["all", lang === "en" ? "All tickets" : "Alle Ereignisse"],
    ["open", lang === "en" ? "Open" : "Offen"],
    ["new", lang === "en" ? "New" : "Neu"],
    ["resolved", lang === "en" ? "Resolved" : "Gelöst"],
    ["closed", lang === "en" ? "Closed" : "Geschlossen"],
  ];
  return (
    head(
      "Ereignisse",
      lang === "en"
        ? "All reported and handled tickets."
        : "Alle gemeldeten und bearbeiteten Ereignisse.",
    ) +
    createBar +
    `<div class="pilltabs incident-view-tabs">${tabs.map(([key, label]) => `<button class="${incidentListMode === key ? "active" : ""}" onclick="setIncidentListMode('${key}')">${label} <span>(${incidentCountForMode(key)})</span></button>`).join("")}</div><div class="filters"><input id="fsearch" placeholder="${lang === "en" ? "Search …" : "Suchen …"}" oninput="filterTable()"><select id="fstatus" onchange="filterTable()"><option value="">${lang === "en" ? "All statuses" : "Alle Status"}</option>${["New", "In Progress", "Delegated", "Resolved", "Closed"].map((s) => `<option value="${s}">${statusDE(s)}</option>`).join("")}</select><select id="fwork" onchange="filterTable()"><option value="">${lang === "en" ? "All workplaces" : "Alle Arbeitsplätze"}</option>${workplaces.map((w) => `<option>${w}</option>`).join("")}</select><select id="fcat" onchange="filterTable()"><option value="">${lang === "en" ? "All categories" : "Alle Kategorien"}</option>${categories.map((c) => `<option>${c}</option>`).join("")}</select><select id="fassignee" onchange="incidentAssignee=this.value;filterTable()"><option value="">${lang === "en" ? "All assignees" : "Alle Zuständigen"}</option><option value="Nicht zugewiesen" ${effectiveAssignee() === "Nicht zugewiesen" ? "selected" : ""}>${lang === "en" ? "Unassigned" : "Nicht zugewiesen"}</option>${supporters.map((person) => `<option value="${escapeHtml(person)}" ${person === effectiveAssignee() ? "selected" : ""}>${escapeHtml(person)}</option>`).join("")}</select><button class="btn" onclick="resetFilters()">${lang === "en" ? "Reset" : "Zurücksetzen"}</button></div><div id="incidenttable">${tableRows(getFilteredIncidents())}</div><p class="sub" id="incidentCountNote" style="margin-top:12px"></p>`
  );
}

function matchesIncidentListMode(incident, mode) {
  switch (mode) {
    case "all":
      return true;
    case "open":
      return ["New", "In Progress", "Delegated"].includes(incident.status);
    case "new":
      return incident.status === "New";
    case "resolved":
      return incident.status === "Resolved";
    case "closed":
      return incident.status === "Closed";
    default:
      return false;
  }
}

function incidentCountForMode(mode) {
  const a = effectiveAssignee();
  return incidents.filter(
    (incident) =>
      (!a || incident.assignee === a) && matchesIncidentListMode(incident, mode),
  ).length;
}

function setIncidentListMode(mode) {
  incidentListMode = mode;
  filterTable();
}

function getFilteredIncidents() {
  const q = ($("#fsearch")?.value || "").toLowerCase(),
    s = $("#fstatus")?.value || "",
    w = $("#fwork")?.value || "",
    c = $("#fcat")?.value || "",
    a = effectiveAssignee();
  return incidents.filter(
    (incident) =>
      matchesIncidentListMode(incident, incidentListMode) &&
      (!q ||
        [incident.id, incident.description, incident.reporter, incident.assignee]
          .join(" ")
          .toLowerCase()
          .includes(q)) &&
      (!s || incident.status === s) &&
      (!w || incident.workplace === w) &&
      (!c || incident.category === c) &&
      (!a || incident.assignee === a),
  );
}

function filterTable() {
  const list = getFilteredIncidents();
  const table = $("#incidenttable");
  if (table) table.innerHTML = tableRows(list);
  const note = $("#incidentCountNote");
  if (note)
    note.textContent = `${list.length} ${lang === "en" ? "incidents shown · Click any row to open it." : "Ereignisse angezeigt · Klicke auf eine Zeile, um sie zu öffnen."} ${lang === "en" ? "Demo data is stored locally in this browser." : "Demo-Daten werden lokal im Browser gespeichert."}`;
  document.querySelectorAll(".incident-view-tabs button").forEach((b, index) => {
    const m = ["all", "open", "new", "resolved", "closed"][index];
    b.classList.toggle("active", m === incidentListMode);
    const sp = b.querySelector("span");
    if (sp) sp.textContent = `(${incidentCountForMode(m)})`;
  });
}

function resetFilters() {
  incidentAssignee = null;
  ["fsearch", "fstatus", "fwork", "fcat"].forEach((id) => {
    const el = $("#" + id);
    if (el) el.value = "";
  });
  const fa = $("#fassignee");
  if (fa) fa.value = effectiveAssignee();
  setIncidentListMode("all");
}
