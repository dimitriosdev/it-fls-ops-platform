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
