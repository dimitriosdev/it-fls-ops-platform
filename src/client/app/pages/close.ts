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
