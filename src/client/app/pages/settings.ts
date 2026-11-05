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
