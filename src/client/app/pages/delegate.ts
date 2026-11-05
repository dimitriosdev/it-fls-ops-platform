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
