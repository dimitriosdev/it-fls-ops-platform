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
