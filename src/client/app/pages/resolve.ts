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
