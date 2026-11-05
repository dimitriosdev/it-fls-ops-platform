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
