let lang = localStorage.getItem("it-demo-language") || "de";
let incidents;
try {
  incidents = JSON.parse(localStorage.getItem("it-demo-incidents")) || seed;
} catch (e) {
  incidents = seed;
}
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
let page = "dashboard",
  selectedId = null,
  reportPeriod = "Wöchentlich";
let currentRole = localStorage.getItem("it-demo-role") || "supporter";
let currentUser = localStorage.getItem("it-demo-user") || supporters[0];
window.getItSupportDemoContext = () => ({
  lang,
  currentRole,
  currentUser,
  teamLeader,
});
let incidentListMode = "all",
  incidentAssignee = null,
  tableSort = { key: "", dir: 1 };
function effectiveAssignee() {
  return incidentAssignee !== null
    ? incidentAssignee
    : currentRole === "supporter"
      ? currentUser
      : "";
}
const $ = (s) =>
  document.querySelector<
    HTMLElement & { value: string; checked: boolean; required: boolean }
  >(s);
const escapeHtml = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const fmt = (s) =>
  s
    ? new Date(s).toLocaleString("de-CH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "–";
const statusClass = (s) =>
  ({
    New: "b-new",
    "In Progress": "b-progress",
    Delegated: "b-delegated",
    Resolved: "b-resolved",
    Closed: "b-closed",
  })[s] || "b-closed";
const statusDE = (s) => {
  let de =
    {
      New: "Neu",
      "In Progress": "In Bearbeitung",
      Delegated: "Delegiert",
      Resolved: "Gelöst",
      Closed: "Geschlossen",
    }[s] || s;
  return lang === "en"
    ? {
        Neu: "New",
        "In Bearbeitung": "In progress",
        Delegiert: "Delegated",
        Gelöst: "Resolved",
        Geschlossen: "Closed",
      }[de] || de
    : de;
};
function persist() {
  localStorage.setItem("it-demo-incidents", JSON.stringify(incidents));
}
function toast(msg) {
  $("#toastroot").innerHTML = `<div class="toast">${escapeHtml(msg)}</div>`;
  setTimeout(() => ($("#toastroot").innerHTML = ""), 2600);
}
function addEvent(t, actor = "Dimitrios Metozis") {
  return [t, actor, new Date().toISOString().slice(0, 16)];
}
function setPage(p) {
  if (p === "new" && currentRole !== "reporter") {
    toast(
      lang === "en"
        ? "Only reporters can create incidents"
        : "Nur Reporter können Ereignisse erstellen",
    );
    return;
  }
  page = p;
  render();
}
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
function renderNav() {
  const items =
    currentRole === "reporter"
      ? NAV.filter(([p]) => ["dashboard", "new"].includes(p))
      : NAV.filter(([p]) => p !== "new" || currentRole === "reporter");
  $("#nav").innerHTML = items
    .map(
      ([p, i, t]) =>
        `<button type="button" class="menu-child ${page === p || (["incidents", "detail", "resolve", "delegate", "close", "settings"].includes(page) && p === "dashboard") ? "active" : ""}" aria-current="${page === p ? "page" : "false"}" onclick="setPage('${p}')">${t}</button>`,
    )
    .join("");
  const favoriteIncidents = $("#favoriteIncidents"),
    favoriteNew = $("#favoriteNew");
  if (favoriteIncidents) favoriteIncidents.hidden = currentRole === "reporter";
  if (favoriteNew) favoriteNew.hidden = currentRole !== "reporter";
}

const pageRenderers = {
  dashboard,
  incidents: incidentList,
  new: incidentForm,
  detail: detailPage,
  resolve: resolvePage,
  delegate: delegatePage,
  close: closePage,
  reports: reportsPage,
  settings: settingsPage,
};

const translations = {
  Dashboard: "Dashboard",
  Ereignisse: "Incidents",
  Berichte: "Reports",
  Einstellungen: "Settings",
  "Willkommen zurück. Hier ist die aktuelle Übersicht.":
    "Welcome back. Here is your current overview.",
  "Alle gemeldeten und bearbeiteten Ereignisse.": "All reported and handled incidents.",
  "Erfasse ein Problem in wenigen Schritten.": "Report an issue in just a few steps.",
  "Übersicht für Teamleitung · Demo-Auswertung": "Team leader overview · Demo report",
  "Konfiguration für die Demo": "Demo configuration",
  "Direkt durch Support gelöst": "Resolved directly by Support",
  "Delegierte Ereignisse": "Delegated incidents",
  "Offene Ereignisse": "Open tickets",
  "Ø Support-Lösungszeit": "Avg. Support resolution time",
  "gegenüber Vorwoche": "vs. previous week",
  "Zur Information weitergegeben": "Passed on for information",
  "Neu oder in Bearbeitung": "New or in progress",
  "Nur direkte Support-Lösungen": "Direct Support resolutions only",
  "Ereignisse nach Arbeitsplatz": "Incidents by workplace",
  "Ereignisse nach Kategorie": "Incidents by category",
  "Letzte Ereignisse": "Recent incidents",
  "Alle anzeigen →": "View all →",
  Referenz: "Reference",
  Erstellt: "Created",
  Beschreibung: "Description",
  Arbeitsplatz: "Workplace",
  Kategorie: "Category",
  Status: "Status",
  "Zugewiesen an": "Assigned to",
  Details: "Details",
  "Alle Status": "All statuses",
  "Alle Arbeitsplätze": "All workplaces",
  "Alle Kategorien": "All categories",
  Zurücksetzen: "Reset",
  "Neues Ereignis": "New incident",
  Priorität: "Priority",
  "Gemeldet von": "Reported by",
  Problembeschreibung: "Issue description",
  "Bitte beschreibe das Problem so genau wie möglich …":
    "Please describe the issue in as much detail as possible …",
  Abbrechen: "Cancel",
  "Ereignis erstellen": "Create incident",
  Neu: "New",
  "In Bearbeitung": "In progress",
  Delegiert: "Delegated",
  Gelöst: "Resolved",
  Geschlossen: "Closed",
  Übersicht: "Overview",
  Aktivitäten: "Activity",
  Aktionen: "Actions",
  "Direkt durch Support erledigen": "Resolve directly by Support",
  "Delegieren / informieren": "Delegate / inform",
  "Person oder Team informieren": "Inform a person or team",
  "Supporter zuweisen": "Assign supporter",
  "Zuweisung speichern": "Save assignment",
  "Als Reporter gelöst markieren": "Mark resolved as reporter",
  Schliessen: "Close",
  "Das Ereignis bleibt ungelöst/offen, bis jemand ihn als gelöst markiert. Es gibt keine Nachverfolgung des externen Auftrags.":
    "The incident remains open until someone marks the issue as resolved. External work is not tracked.",
  "Problem lösen": "Resolve issue",
  Lösungszusammenfassung: "Resolution summary",
  "Gelöst von": "Resolved by",
  "Was wurde gemacht, um das Problem zu lösen?": "What was done to resolve the issue?",
  "Lösung speichern": "Save resolution",
  "Nur direkte Lösungen durch Support zählen zur Kennzahl „Durch Support gelöst“. Delegierte Ereignisse werden nicht als Support-Lösung gezählt.":
    "Only issues resolved directly by Support count as Support resolutions. Delegated incidents do not count as resolved by Support.",
  "Delegieren / Informieren": "Delegate / Inform",
  "Die externe Arbeit wird nicht weiterverfolgt": "External work is not tracked",
  "Wen hast du informiert?": "Who did you inform?",
  "Kurzer Hinweis (optional)": "Short note (optional)",
  "z. B. Fehler gemeldet, zuständige Person informiert …":
    "e.g. issue reported, responsible person informed …",
  "Delegation speichern": "Save delegation",
  "Ereignis schliessen": "Close incident",
  "Ereignis schliessen?": "Close incident?",
  "Das Ereignis wird als geschlossen markiert. Die Schliessung ist getrennt von einer Lösung durch Support.":
    "The incident will be marked closed. Closure is separate from resolution by Support.",
  "Dieses Ereignis ist noch nicht als gelöst markiert. Möchtest du ihn trotzdem schliessen? Für die Demo ist das möglich.":
    "This incident is not marked resolved yet. Do you still want to close it? This is allowed in the demo.",
  "Zusammenfassung · ": "Summary · ",
  Wöchentlich: "Weekly",
  Monatlich: "Monthly",
  "Gesamt Ereignisse": "Total incidents",
  "Durch Support gelöst": "Resolved by Support",
  "Durch Reporter gelöst": "Resolved by reporter",
  "Delegiert / informiert": "Delegated / informed",
  "Top wiederkehrende Probleme nach Kategorie": "Top recurring issues by category",
  Abschlussübersicht: "Closure overview",
  "Aktuell delegiert": "Currently delegated",
  "Offen / in Bearbeitung": "Open / in progress",
  "Berichte werden aus den lokalen Beispieldaten berechnet. Der Zeitraum ist für die Demo illustrativ und keine revisionssichere Auswertung.":
    "Reports are calculated from local sample data. The period is illustrative and not an audit-ready report.",
  "Kategorien verwalten": "Manage categories",
  "Neue Kategorie (Demo)": "New category (demo)",
  "Kategorie hinzufügen": "Add category",
  "Demo verwalten": "Manage demo",
  "Alle Änderungen werden nur in diesem Browser gespeichert.":
    "All changes are stored only in this browser.",
  Speicherung: "Storage",
  Backend: "Backend",
  "Nicht verbunden": "Not connected",
  "Demo-Daten zurücksetzen": "Reset demo data",
  "Keine echten personenbezogenen oder vertraulichen Daten verwenden. Dies ist ein Mock-up ohne Anmeldung oder Zugriffsschutz.":
    "Do not use real personal or confidential data. This is a mock-up without login or access control.",
  "Benutzer & Rollen (Beispiel)": "Users & roles (sample)",
  Name: "Name",
  Rolle: "Role",
  Aktiv: "Active",
  Teamleitung: "Team leader",
  Supporter: "Supporter",
  Reporter: "Reporter",
  "Bitte Kategorie eingeben": "Please enter a category",
  "Kategorie existiert bereits": "Category already exists",
  Zurück: "Back",
  "Erstellt von": "Reported by",
  Lösung: "Resolution",
  Delegationsnotiz: "Delegation note",
  "Informiert: ": "Informed: ",
  "Ereignis als gelöst markiert": "Incident marked resolved",
  "Delegation dokumentiert": "Delegation recorded",
  "Zuweisung gespeichert": "Assignment saved",
  "Ereignis geschlossen": "Incident closed",
  "Elektro-Team": "Electrical team",
  Gebäudemanagement: "Facilities management",
  Applikationsverantwortliche: "Application owner",
  "Netzwerk-Team": "Network team",
  "Andere zuständige Person": "Other responsible person",
  Hardware: "Hardware",
  Software: "Software",
  Zugang: "Access",
  Netzwerk: "Network",
  Sonstige: "Other",
  Maus: "Mouse",
  Tastatur: "Keyboard",
};
function toggleLanguage() {
  lang = lang === "de" ? "en" : "de";
  localStorage.setItem("it-demo-language", lang);
  render();
}
function translateDOM(root) {
  if (lang !== "en") return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    let t = n.nodeValue.trim();
    if (translations[t]) n.nodeValue = n.nodeValue.replace(t, translations[t]);
  }
  root.querySelectorAll("input[placeholder],textarea[placeholder]").forEach((el) => {
    if (translations[el.placeholder]) el.placeholder = translations[el.placeholder];
  });
  root.querySelectorAll("button").forEach((b) => {
    if (b.textContent.trim() === "DE / EN") b.textContent = "EN / DE";
  });
}

function render() {
  document.body.classList.toggle("role-reporter", currentRole === "reporter");
  if (page === "new" && currentRole !== "reporter") page = "dashboard";
  renderNav();
  updateTopbar();
  const view = $("#view");
  view.innerHTML = (pageRenderers[page] || dashboard)();
  translateDOM(view);
  moveHeadToTopbar(view);
  if (page === "reports") updateReports();
  window.dispatchEvent(new Event("it-support-demo:context-change"));
}
function moveHeadToTopbar(view) {
  const title = $("#topbarTitle"),
    sub = $("#topbarSub");
  const heading = view.querySelector(".pagehead > div > h1");
  if (title) title.innerHTML = heading ? heading.innerHTML : "";
  if (sub) {
    const subtitle = heading && heading.parentElement.querySelector(".sub");
    sub.innerHTML = subtitle ? subtitle.innerHTML : "";
  }
  if (!heading) return;
  const pagehead = heading.closest(".pagehead");
  heading.parentElement.remove();
  if (pagehead.children.length) pagehead.classList.add("no-title");
  else pagehead.remove();
}
function updateTopbar() {
  const rp = $("#rolePicker");
  if (rp) rp.value = currentRole;
  const user =
    currentRole === "reporter"
      ? currentUser
      : currentRole === "leader"
        ? teamLeader
        : currentUser;
  const ul = $("#currentUserLabel"),
    av = $("#currentAvatar");
  if (ul) ul.textContent = user;
  const fresh = incidents.filter((i) => i.status === "New").length;
  const n = $("#notificationCount");
  if (n) {
    n.textContent = fresh > 0 ? fresh : "";
    n.style.display = fresh > 0 && currentRole !== "reporter" ? "grid" : "none";
  }
  const b = $("#notificationBell");
  if (b) b.style.display = currentRole === "reporter" ? "none" : "inline-flex";
}
function changeRole(role) {
  incidentAssignee = null;
  currentRole = role;
  currentUser =
    role === "reporter"
      ? reporters.includes(currentUser)
        ? currentUser
        : reporters[0]
      : role === "leader"
        ? teamLeader
        : supporters.includes(currentUser)
          ? currentUser
          : supporters[0];
  localStorage.setItem("it-demo-role", currentRole);
  localStorage.setItem("it-demo-user", currentUser);
  render();
}
function showNotifications() {
  incidentListMode = "new";
  incidentAssignee = "";
  setPage("incidents");
}
function chooseReporter(name) {
  currentUser = name;
  localStorage.setItem("it-demo-user", name);
  render();
}
function dateKey(d) {
  return new Date(d).toISOString().slice(0, 10);
}
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
function incidentForm() {
  return (
    head("Neues Ereignis", "Erfasse ein Problem in wenigen Schritten.") +
    `<div class="card"><form onsubmit="createIncident(event)"><div class="formgrid"><div class="field"><label>Arbeitsplatz / Ort <span class="required">*</span></label><input name="workplace" list="workplaceList" required autocomplete="off" maxlength="80" placeholder="Tippen, um Vorschläge zu sehen, oder eigenen Ort eingeben …"><datalist id="workplaceList">${workplaces.map((x) => `<option value="${escapeHtml(x)}">`).join("")}</datalist></div><div class="field"><label>Kategorie <span class="required">*</span></label><input name="category" list="categoryList" required autocomplete="off" maxlength="80" placeholder="Tippen, um Vorschläge zu sehen, oder eigene Kategorie eingeben …"><datalist id="categoryList">${categories.map((x) => `<option value="${escapeHtml(x)}">`).join("")}</datalist></div></div><div class="field"><label>Problembeschreibung <span class="required">*</span></label><textarea name="description" maxlength="500" placeholder="Bitte beschreibe das Problem so genau wie möglich …" required></textarea></div><div class="formactions"><button type="button" class="btn" onclick="setPage('incidents')">Abbrechen</button><button class="btn primary">Ereignis erstellen</button></div></form></div>`
  );
}
function createIncident(e) {
  e.preventDefault();
  let f = new FormData(e.target);
  let id =
    "INC-" + (1009 + Math.max(0, ...incidents.map((i) => Number(i.id.slice(4)) - 1008)));
  let i = {
    id,
    date: new Date().toISOString().slice(0, 16),
    workplace: String(f.get("workplace")).trim(),
    category: String(f.get("category")).trim(),
    description: f.get("description"),
    status: "New",
    priority: "Mittel",
    assignee: "Nicht zugewiesen",
    reporter: currentUser,
    resolution: "",
    events: [addEvent("Ereignis erstellt", currentUser)],
  };
  incidents.unshift(i);
  persist();
  selectedId = id;
  toast(`${id} wurde erstellt`);
  setPage("detail");
}
function openIncident(id) {
  selectedId = id;
  setPage("detail");
}
function current() {
  return incidents.find((i) => i.id === selectedId) || incidents[0];
}
function detailPage() {
  let i = current();
  if (!i) return incidentList();
  const en = lang === "en";
  const isReporterOwner = currentRole === "reporter" && i.reporter === currentUser;
  const isSupporter = currentRole === "supporter";
  const isOpen = !["Resolved", "Closed"].includes(i.status);
  const assignedToMe = i.assignee === currentUser;
  const primary = (label, fn, icon = "") =>
    `<button class="btn primary" onclick="${fn}">${icon}${label}</button>`;
  const secondary = (label, fn) =>
    `<button class="btn" onclick="${fn}">${label}</button>`;
  let buttons = "",
    hint = "";
  if (isSupporter && isOpen) {
    if (!assignedToMe) {
      buttons = primary(
        en ? "Take over task" : "Aufgabe übernehmen",
        "takeOverIncident()",
      );
      hint = en
        ? "Take ownership to start working on this incident."
        : "Übernimm das Ereignis, um mit der Bearbeitung zu beginnen.";
    } else {
      buttons = primary(
        en ? "Resolve incident" : "Ereignis lösen",
        "setPage('resolve')",
        "✓ ",
      );
      hint = en
        ? "Record the outcome and what you did."
        : "Ergebnis und durchgeführte Schritte dokumentieren.";
    }
  } else if (isReporterOwner && isOpen) {
    buttons = primary(
      en ? "Mark as resolved" : "Als gelöst markieren",
      "markReporterResolved()",
      "✓ ",
    );
    hint = en
      ? "If the issue is fixed, you can mark it as resolved."
      : "Wenn das Problem behoben ist, kannst du es als gelöst markieren.";
  } else if (i.status === "Resolved" && (isReporterOwner || isSupporter)) {
    buttons =
      primary(en ? "Mark as closed" : "Als geschlossen markieren", "closeIncident()") +
      secondary("↺ " + (en ? "Reopen" : "Wiedereröffnen"), "reopenIncident()");
    hint = en
      ? "Resolved, not yet closed. Close it when the follow-up is complete."
      : "Gelöst, aber noch nicht geschlossen. Schliesse es nach der Nachbearbeitung.";
  } else if (i.status === "Closed" && (isReporterOwner || isSupporter)) {
    buttons = secondary("↺ " + (en ? "Reopen" : "Wiedereröffnen"), "reopenIncident()");
    hint = en
      ? "Problem came back or the resolution did not work?"
      : "Problem erneut aufgetreten oder Lösung hat nicht funktioniert?";
  }
  const actionBar = buttons
    ? `<div class="actionbar">${buttons}<span class="actionhint">${hint}</span></div>`
    : "";
  const fact = (label, value, wide = false) =>
    `<div class="fact${wide ? " wide" : ""}"><span>${label}</span><strong>${value}</strong></div>`;
  const facts = [
    fact(en ? "Workplace" : "Arbeitsplatz", escapeHtml(i.workplace)),
    fact(en ? "Category" : "Kategorie", escapeHtml(i.category)),
    fact(en ? "Priority" : "Priorität", escapeHtml(i.priority)),
    fact(en ? "Created" : "Erstellt", fmt(i.date)),
    fact(en ? "Reported by" : "Erstellt von", escapeHtml(i.reporter)),
    fact(en ? "Assigned to" : "Zugewiesen an", escapeHtml(i.assignee)),
    i.reopenedCount
      ? fact(en ? "Reopened" : "Wiedereröffnet", i.reopenedCount + "×")
      : "",
    i.resolution
      ? fact(en ? "Resolution" : "Lösung", escapeHtml(i.resolution), true)
      : "",
    i.delegatedTo ? fact(en ? "Informed" : "Informiert", escapeHtml(i.delegatedTo)) : "",
    i.delegationNote
      ? fact(en ? "Note" : "Hinweis", escapeHtml(i.delegationNote), true)
      : "",
  ].join("");
  const timeline = (i.events || [])
    .slice()
    .reverse()
    .map(
      (e) =>
        `<div class="event"><div class="eventmark">✓</div><div class="eventbody"><strong>${escapeHtml(e[0])}</strong><small>${fmt(e[2])} · ${escapeHtml(e[1])}</small></div></div>`,
    )
    .join("");
  return (
    head(`${i.id} &nbsp; ${badge(i.status)}`, i.description, "", "setPage('incidents')") +
    actionBar +
    `<div class="detailgrid compact"><div class="card"><h2>Details</h2><div class="factgrid">${facts}</div></div><div class="card" id="activitycard"><h2>${en ? "Activity" : "Aktivitäten"}</h2><div class="timeline">${timeline}</div></div></div>`
  );
}
function takeOverIncident() {
  const i = current();
  if (!i || currentRole !== "supporter" || ["Resolved", "Closed"].includes(i.status))
    return;
  i.assignee = currentUser;
  i.assignedAt = i.assignedAt || new Date().toISOString();
  i.status = "In Progress";
  i.events.push(addEvent("Bearbeitung übernommen", currentUser));
  persist();
  toast(
    lang === "en" ? "You have taken over this incident" : "Ereignis wurde übernommen",
  );
  render();
}

function reopenIncident() {
  const i = current();
  if (!i || !["Resolved", "Closed"].includes(i.status)) return;
  const allowed =
    currentRole === "supporter" ||
    (currentRole === "reporter" && i.reporter === currentUser);
  if (!allowed) {
    toast(
      lang === "en"
        ? "Only the reporter or a supporter can reopen this incident"
        : "Nur der Reporter oder ein Supporter kann dieses Ereignis wiedereröffnen",
    );
    return;
  }
  i.reopenedCount = (i.reopenedCount || 0) + 1;
  if (i.resolvedBy && i.resolutionSource !== "Reporter")
    i.reopenedFrom = [...(i.reopenedFrom || []), i.resolvedBy];
  i.previousResolution = i.resolution;
  i.resolution = "";
  i.resolvedBy = null;
  i.resolvedAt = null;
  i.resolutionSource = null;
  i.closedAt = null;
  i.status = leadUnassignedCheck(i) ? "New" : "In Progress";
  i.events.push(
    addEvent(
      lang === "en" ? "Incident reopened" : "Ereignis wiedereröffnet",
      currentUser,
    ),
  );
  persist();
  toast(lang === "en" ? "Incident reopened" : "Ereignis wiedereröffnet");
  render();
}
function leadUnassignedCheck(i) {
  return !i.assignee || i.assignee === "Nicht zugewiesen";
}
function showActivity() {
  $("#activitycard")?.scrollIntoView({ behavior: "smooth" });
}
function assignIncident() {
  let i = current();
  i.assignee = $("#assignTo").value;
  i.assignedAt = i.assignedAt || new Date().toISOString();
  i.status = i.status === "New" ? "In Progress" : i.status;
  i.events.push(addEvent("Supporter zugewiesen: " + i.assignee));
  persist();
  toast("Zuweisung gespeichert");
  render();
}
function resolvePage() {
  let i = current();
  const en = lang === "en";
  return (
    head(
      en ? "Resolve incident" : "Ereignis lösen",
      `${i.id} · ${en ? "Record the outcome" : "Ergebnis dokumentieren"}`,
      "",
      "setPage('detail')",
      i.id,
    ) +
    `<div class="card" style="max-width:850px"><form onsubmit="resolveIncident(event)">
                <div class="field"><label>${en ? "What happened?" : "Was ist passiert?"} <span class="required">*</span></label>
                    <label style="font-weight:500;display:flex;gap:9px;align-items:flex-start"><input type="radio" name="outcome" value="action_taken" checked onchange="toggleResolutionFields()" style="width:auto;margin-top:3px"> <span>${en ? "I took action to resolve the problem." : "Ich habe eine Massnahme zur Lösung des Problems durchgeführt."}</span></label>
                    <label style="font-weight:500;display:flex;gap:9px;align-items:flex-start"><input type="radio" name="outcome" value="external" onchange="toggleResolutionFields()" style="width:auto;margin-top:3px"> <span>${en ? "I informed an external person or team." : "Ich habe eine externe Person oder ein anderes Team informiert."}</span></label>
                    <label style="font-weight:500;display:flex;gap:9px;align-items:flex-start"><input type="radio" name="outcome" value="self_resolved" onchange="toggleResolutionFields()" style="width:auto;margin-top:3px"> <span>${en ? "The problem resolved itself; no action was needed." : "Das Problem hat sich von selbst gelöst; es war keine Massnahme nötig."}</span></label>
                </div>
                <div class="field" id="resolutionDescriptionField"><label>${en ? "Resolution description" : "Beschreibung der Lösung"} <span class="required">*</span></label><div class="sub">${en ? "Optional source examples (original German wording)" : "Optionale Beispiele aus den Quelldaten (Originalwortlaut)"}</div><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="resolutionExample" list="resolutionExampleList" placeholder="${en ? "Search example descriptions…" : "Beispielbeschreibung suchen …"}" style="flex:1;min-width:220px"><datalist id="resolutionExampleList">${resolutionExamples.map((x) => `<option value="${escapeHtml(x)}"></option>`).join("")}</datalist><button type="button" class="btn" onclick="applyResolutionExample()">${en ? "Use example" : "Beispiel übernehmen"}</button></div><textarea id="resolutionDescription" name="resolution" maxlength="700" required placeholder="${en ? "Describe what you did to resolve the issue…" : "Beschreibe, was du zur Lösung des Problems gemacht hast …"}"></textarea></div>
                <div id="externalInfoFields" style="display:none"><div class="field"><label>${en ? "Person or team informed" : "Informierte Person oder Team"} <span class="required">*</span></label><input name="target" id="externalTarget" maxlength="120" placeholder="${en ? "e.g. electrician, Don't Panic team" : "z. B. Elektriker, Don't Panic Team"}"></div><div class="field"><label>${en ? "What information did you pass on?" : "Welche Information hast du weitergegeben?"} <span class="required">*</span></label><textarea name="delegationInfo" id="delegationInfo" maxlength="500" placeholder="${en ? "Describe briefly what you reported or agreed…" : "Beschreibe kurz, was du gemeldet oder vereinbart hast …"}"></textarea></div></div>
                <div class="field"><label>${en ? "Resolved by" : "Gelöst von"}</label><input value="${escapeHtml(currentUser)}" disabled><input type="hidden" name="actor" value="${escapeHtml(currentUser)}"></div>
                <div class="notice">${en ? "The incident will be marked resolved when saved. If you informed another team, only the information you enter here is recorded; their work is not tracked." : "Beim Speichern wird das Ereignis als gelöst markiert. Wenn du ein anderes Team informiert hast, wird nur die hier erfasste Information dokumentiert; dessen Arbeit wird nicht nachverfolgt."}</div>
                <div class="formactions"><button type="button" class="btn" onclick="setPage('detail')">${en ? "Cancel" : "Abbrechen"}</button><button class="btn primary">${en ? "Save resolution" : "Lösung speichern"}</button></div></form></div>`
  );
}
function applyResolutionExample() {
  const example = $("#resolutionExample")?.value || "";
  if (!example || !resolutionExamples.includes(example)) {
    toast(
      lang === "en"
        ? "Choose one of the source examples"
        : "Bitte ein Beispiel aus den Quelldaten auswählen",
    );
    return;
  }
  const description = $("#resolutionDescription");
  if (description) description.value = example;
  const action = document.querySelector<HTMLInputElement>(
    'input[name="outcome"][value="action_taken"]',
  );
  if (action) action.checked = true;
  toggleResolutionFields();
}
function toggleResolutionFields() {
  const outcome =
    document.querySelector<HTMLInputElement>('input[name="outcome"]:checked')?.value ||
    "action_taken";
  const actionField = $("#resolutionDescriptionField"),
    desc = $("#resolutionDescription");
  const informed = outcome === "external";
  const externalFields = $("#externalInfoFields"),
    target = $("#externalTarget"),
    info = $("#delegationInfo");
  if (actionField)
    actionField.style.display = outcome === "action_taken" ? "block" : "none";
  if (desc) desc.required = outcome === "action_taken";
  if (externalFields) externalFields.style.display = informed ? "block" : "none";
  if (target) target.required = informed;
  if (info) info.required = informed;
}
function resolveIncident(e) {
  e.preventDefault();
  const f = new FormData(e.target),
    i = current();
  const outcome = f.get("outcome");
  const informed = outcome === "external";
  const description =
    outcome === "action_taken"
      ? String(f.get("resolution") || "").trim()
      : informed
        ? (lang === "en"
            ? "External person/team informed: "
            : "Externe Person/Team informiert: ") +
          String(f.get("target") || "").trim() +
          " — " +
          String(f.get("delegationInfo") || "").trim()
        : lang === "en"
          ? "The problem resolved itself; no action was needed."
          : "Das Problem hat sich von selbst gelöst; es war keine Massnahme nötig.";
  i.resolution = description;
  i.resolvedBy = currentUser;
  i.resolvedAt = new Date().toISOString();
  i.resolutionSource = "Support";
  // Resolution and closure are separate lifecycle steps. Every resolution
  // remains Resolved until a reporter or supporter explicitly closes it.
  i.status = "Resolved";
  if (informed) {
    i.delegatedTo = String(f.get("target") || "").trim();
    i.delegationNote = String(f.get("delegationInfo") || "").trim();
    i.events.push(
      addEvent(
        (lang === "en"
          ? "External person/team informed: "
          : "Externe Person/Team informiert: ") +
          i.delegatedTo +
          " — " +
          i.delegationNote,
        currentUser,
      ),
    );
  }
  i.events.push(
    addEvent(
      outcome === "self_resolved"
        ? lang === "en"
          ? "Resolved by Support — issue resolved itself"
          : "Durch Support gelöst — Problem hat sich selbst gelöst"
        : (lang === "en"
            ? "Resolved directly by Support"
            : "Direkt durch Support gelöst") +
            (informed
              ? lang === "en"
                ? " (external party informed)"
                : " (externe Stelle informiert)"
              : ""),
      currentUser,
    ),
  );
  i.closedAt = null;
  i.events.push(
    addEvent(
      lang === "en" ? "Awaiting explicit closure" : "Wartet auf explizite Schliessung",
      currentUser,
    ),
  );
  persist();
  toast(
    lang === "en"
      ? "Incident resolved — ready to be closed"
      : "Ereignis gelöst — kann geschlossen werden",
  );
  setPage("detail");
}
function delegatePage() {
  let i = current();
  return (
    head(
      "Delegieren / Informieren",
      `${i.id} · Die externe Arbeit wird nicht weiterverfolgt`,
      "",
      "setPage('detail')",
      i.id,
    ) +
    `<div class="card" style="max-width:850px"><form onsubmit="delegateIncident(event)"><div class="field"><label>${lang === "en" ? "Person or team informed" : "Informierte Person oder Team"} <span class="required">*</span></label><input name="target" required maxlength="120" placeholder="${lang === "en" ? "e.g. electrician, Don't Panic team, network team" : "z. B. Elektriker, Don't Panic Team, Netzwerk-Team"}"></div><div class="field"><label>Kurzer Hinweis (optional)</label><textarea name="note" maxlength="300" placeholder="z. B. Fehler gemeldet, zuständige Person informiert …"></textarea></div><div class="notice">Das Ereignis bleibt ungelöst/offen, bis jemand ihn als gelöst markiert. Es gibt keine Nachverfolgung des externen Auftrags.</div><div class="formactions"><button type="button" class="btn" onclick="setPage('detail')">Abbrechen</button><button class="btn primary">Delegation speichern</button></div></form></div>`
  );
}
function delegateIncident(e) {
  e.preventDefault();
  let f = new FormData(e.target),
    i = current();
  i.status = "Delegated";
  i.delegatedTo = f.get("target");
  i.delegationNote = f.get("note");
  i.events.push(addEvent("Informiert: " + i.delegatedTo));
  persist();
  toast("Delegation dokumentiert");
  setPage("detail");
}
function markReporterResolved() {
  let i = current();
  i.status = "Resolved";
  i.resolutionSource = "Reporter";
  i.resolvedBy = i.reporter;
  i.resolvedAt = new Date().toISOString();
  i.events.push(addEvent("Durch Reporter als gelöst markiert", i.reporter));
  persist();
  toast("Als durch Reporter gelöst markiert");
  render();
}
function closePage() {
  let i = current();
  return (
    head(
      "Ereignis schliessen",
      `${i.id} · Lifecycle beenden`,
      "",
      "setPage('detail')",
      i.id,
    ) +
    `<div class="card" style="max-width:700px"><h2>Ereignis schliessen?</h2><p>Das Ereignis wird als geschlossen markiert. Die Schliessung ist getrennt von einer Lösung durch Support.</p>${!["Resolved", "Closed"].includes(i.status) ? `<div class="notice">Dieses Ereignis ist noch nicht als gelöst markiert. Möchtest du ihn trotzdem schliessen? Für die Demo ist das möglich.</div>` : ""}<div class="formactions"><button class="btn" onclick="setPage('detail')">Abbrechen</button><button class="btn primary" onclick="closeIncident()">Ereignis schliessen</button></div></div>`
  );
}
function closeIncident() {
  let i = current();
  if (!i || i.status !== "Resolved") {
    toast(
      lang === "en"
        ? "Only resolved incidents can be closed"
        : "Nur gelöste Ereignisse können geschlossen werden",
    );
    return;
  }
  const allowed =
    currentRole === "supporter" ||
    (currentRole === "reporter" && i.reporter === currentUser);
  if (!allowed) {
    toast(
      lang === "en"
        ? "Only the assigned reporter or a supporter can close this incident"
        : "Nur der zuständige Reporter oder ein Supporter kann dieses Ereignis schliessen",
    );
    return;
  }
  i.status = "Closed";
  i.closedAt = new Date().toISOString();
  i.events.push(
    addEvent(lang === "en" ? "Incident closed" : "Ereignis geschlossen", currentUser),
  );
  persist();
  toast(lang === "en" ? "Incident closed" : "Ereignis geschlossen");
  setPage("detail");
}
function reportDurationMs(i) {
  const start = new Date(i.date).getTime(),
    end = new Date(i.resolvedAt).getTime();
  return Number.isFinite(start) && Number.isFinite(end) && end >= start
    ? end - start
    : null;
}
function reportDurationLabel(ms) {
  if (ms == null) return "–";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60),
    rest = mins % 60;
  if (hours < 24) return `${hours}h ${rest}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

function settingsPage() {
  return (
    head("Einstellungen", "Konfiguration für die Demo") +
    `<div class="grid2"><div class="card"><h2>Kategorien verwalten</h2>${categories.map((c, i) => `<div class="detailrow"><span>${c}</span><strong>${incidents.filter((x) => x.category === c).length} Ereignisse</strong></div>`).join("")}<div class="field" style="margin-top:15px"><label>Neue Kategorie (Demo)</label><input id="newcat" placeholder="z. B. Telefonie"></div><button class="btn" onclick="addCategory()">Kategorie hinzufügen</button></div><div class="card"><h2>Demo verwalten</h2><p class="sub">Alle Änderungen werden nur in diesem Browser gespeichert.</p><div class="detailrow"><span>Ereignisse</span><strong>${incidents.length}</strong></div><div class="detailrow"><span>Speicherung</span><strong>localStorage</strong></div><div class="detailrow"><span>Backend</span><strong>Nicht verbunden</strong></div><div class="detailrow"><span>Arbeitsplätze</span><strong>${workplaces.length}</strong></div><div class="detailrow"><span>Arbeit-Beispiele</span><strong>${resolutionExamples.length} ${lang === "en" ? "unique suggestions" : "eindeutige Vorschläge"}</strong></div><button class="btn primary" onclick="resetDemo()">Demo-Daten zurücksetzen</button><div class="notice" style="margin-top:16px">Keine echten personenbezogenen oder vertraulichen Daten verwenden. Dies ist ein Mock-up ohne Anmeldung oder Zugriffsschutz.</div></div></div><div class="card"><h2>Benutzer & Rollen (Beispiel)</h2><div class="tablewrap"><table><thead><tr><th>Name</th><th>Rolle</th><th>Status</th></tr></thead><tbody><tr><td>${teamLeader}</td><td>Teamleitung</td><td><span class="badge b-resolved">Aktiv</span></td></tr>${supporters.map((s) => `<tr><td>${s}</td><td>Supporter</td><td><span class="badge b-resolved">Aktiv</span></td></tr>`).join("")}${reporters.map((r) => `<tr><td>${r}</td><td>Reporter</td><td><span class="badge b-resolved">Aktiv</span></td></tr>`).join("")}</tbody></table></div></div>`
  );
}
function addCategory() {
  let c = $("#newcat").value.trim();
  if (!c) return toast("Bitte Kategorie eingeben");
  if (!categories.includes(c)) {
    categories.push(c);
    toast("Kategorie nur für diese Sitzung hinzugefügt");
    render();
  } else toast("Kategorie existiert bereits");
}
function resetDemo() {
  if (confirm("Alle Demo-Änderungen zurücksetzen?")) {
    incidents = JSON.parse(JSON.stringify(seed));
    persist();
    toast("Demo-Daten zurückgesetzt");
    render();
  }
}
render();
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
