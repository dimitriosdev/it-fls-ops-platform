let lang = localStorage.getItem("it-demo-language") || "de";

let incidents;
try {
  incidents = JSON.parse(localStorage.getItem("it-demo-incidents")) || seed;
} catch (e) {
  incidents = seed;
}

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
