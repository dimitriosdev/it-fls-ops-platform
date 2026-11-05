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

function dateKey(d) {
  return new Date(d).toISOString().slice(0, 10);
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
