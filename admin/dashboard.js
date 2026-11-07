const $ = (id) => document.getElementById(id);

async function api(path, options = {}) {
  const response = await fetch(path, { credentials: "same-origin", ...options });
  const type = response.headers.get("content-type") || "";
  const data = type.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const error = new Error(data?.error || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

const labels = {
  "/": "Accueil",
  "/index.html": "Accueil",
  "/tag-rugby.html": "Le Tag Rugby",
  "/club.html": "Le club",
  "/entrainements.html": "Entraînements",
  "/tournois.html": "Tournois",
  "/actualites.html": "Actualités",
  "/contact.html": "Contact",
  "/regles.html": "Les règles",
  "/partenaires.html": "Partenaires",
  "/merci.html": "Confirmation"
};

function formatNumber(value) {
  return new Intl.NumberFormat("fr-FR").format(Number(value) || 0);
}

function shortDate(value) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(`${value}T12:00:00`));
}

function fillSummary(data) {
  $("today-visits").textContent = formatNumber(data.today.visits);
  $("today-views").textContent = formatNumber(data.today.pageViews);
  $("week-visits").textContent = formatNumber(data.last7.visits);
  $("week-views").textContent = formatNumber(data.last7.pageViews);
  $("month-visits").textContent = formatNumber(data.last30.visits);
  $("month-views").textContent = formatNumber(data.last30.pageViews);
}

function renderDaily(data) {
  const root = $("daily-chart");
  root.replaceChildren();
  const rows = data.daily.slice(-14);
  const max = Math.max(1, ...rows.map((row) => row.pageViews));
  rows.forEach((row) => {
    const item = document.createElement("div");
    item.className = "admin-bar-item";
    item.title = `${shortDate(row.date)} · ${formatNumber(row.visits)} visite(s) · ${formatNumber(row.pageViews)} page(s) vue(s)`;
    const value = document.createElement("span");
    value.className = "admin-bar-value";
    value.textContent = row.pageViews ? formatNumber(row.pageViews) : "";
    const barWrap = document.createElement("div");
    barWrap.className = "admin-bar-track";
    const bar = document.createElement("div");
    bar.className = "admin-bar";
    bar.style.height = `${row.pageViews ? Math.max(7, Math.round((row.pageViews / max) * 100)) : 2}%`;
    const label = document.createElement("span");
    label.className = "admin-bar-label";
    label.textContent = shortDate(row.date);
    barWrap.append(bar);
    item.append(value, barWrap, label);
    root.append(item);
  });
}

function renderTopPages(data) {
  const root = $("top-pages");
  root.replaceChildren();
  const pages = data.topPages.slice(0, 8);
  if (!pages.length) {
    const empty = document.createElement("p");
    empty.className = "admin-muted";
    empty.textContent = "Pas encore de données.";
    root.append(empty);
    return;
  }
  const max = Math.max(1, pages[0].pageViews);
  pages.forEach((item) => {
    const row = document.createElement("div");
    row.className = "admin-page-row";
    const head = document.createElement("div");
    head.className = "admin-page-row-head";
    const name = document.createElement("span");
    name.textContent = labels[item.page] || item.page;
    const count = document.createElement("strong");
    count.textContent = formatNumber(item.pageViews);
    head.append(name, count);
    const track = document.createElement("div");
    track.className = "admin-page-track";
    const bar = document.createElement("div");
    bar.className = "admin-page-bar";
    bar.style.width = `${Math.max(3, (item.pageViews / max) * 100)}%`;
    track.append(bar);
    row.append(head, track);
    root.append(row);
  });
}

async function loadStats() {
  const button = $("refresh-stats");
  button.disabled = true;
  $("stats-error").textContent = "";
  try {
    const data = await api("/api/analytics");
    fillSummary(data);
    renderDaily(data);
    renderTopPages(data);
    const generated = new Date(data.generatedAt);
    $("stats-note").textContent = `Dernière mise à jour : ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(generated)}. Une visite correspond à une session de navigation.`;
  } catch (error) {
    $("stats-error").textContent = `Impossible de charger les statistiques : ${error.message}`;
  } finally {
    button.disabled = false;
  }
}

$("refresh-stats").addEventListener("click", loadStats);
$("logout").addEventListener("click", async () => {
  try { await api("/api/auth", { method: "DELETE" }); } finally { window.location.replace("/admin/"); }
});

(async () => {
  try {
    const status = await api("/api/auth");
    if (!status.authenticated) {
      window.location.replace("/admin/");
      return;
    }
    $("admin-app").hidden = false;
    await loadStats();
  } catch {
    window.location.replace("/admin/");
  }
})();
