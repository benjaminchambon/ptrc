const $ = (id) => document.getElementById(id);
const adminApp = $("admin-app");
const editor = $("editor");
const list = $("news-list");
let news = [];

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: { ...(options.body ? { "content-type": "application/json" } : {}), ...(options.headers || {}) }
  });
  const type = response.headers.get("content-type") || "";
  const data = type.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const error = new Error(data?.error || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}


function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function renderList() {
  list.replaceChildren();
  $("news-count").textContent = `${news.length} article${news.length > 1 ? "s" : ""}`;
  if (!news.length) {
    const p = document.createElement("p"); p.className = "admin-muted"; p.textContent = "Aucune actualité pour le moment."; list.append(p); return;
  }
  news.forEach((item) => {
    const article = document.createElement("article"); article.className = "admin-news-item";
    const meta = document.createElement("div"); meta.className = "admin-news-meta";
    const date = document.createElement("span"); date.textContent = formatDate(item.date);
    const status = document.createElement("span"); status.className = `admin-status${item.published ? "" : " draft"}`; status.textContent = item.published ? "Publié" : "Brouillon";
    meta.append(date, status);
    const title = document.createElement("h3"); title.textContent = item.titleFr;
    const actions = document.createElement("div"); actions.className = "admin-news-actions";
    const edit = document.createElement("button"); edit.type = "button"; edit.textContent = "Modifier"; edit.addEventListener("click", () => openEditor(item));
    const del = document.createElement("button"); del.type = "button"; del.className = "danger"; del.textContent = "Supprimer"; del.addEventListener("click", () => deleteNews(item));
    actions.append(edit, del); article.append(meta, title, actions); list.append(article);
  });
}

async function loadNews() {
  news = await api("/api/news?scope=admin");
  renderList();
}

function setPreview(url) {
  const box = $("image-preview");
  const img = box.querySelector("img");
  if (!url) { box.hidden = true; img.removeAttribute("src"); return; }
  img.src = url; box.hidden = false;
}

function openEditor(item = null) {
  $("news-form").reset();
  $("news-id").value = item?.id || "";
  $("news-date").value = item?.date || new Date().toISOString().slice(0, 10);
  $("news-published").checked = item?.published ?? true;
  $("title-fr").value = item?.titleFr || ""; $("title-en").value = item?.titleEn || "";
  $("excerpt-fr").value = item?.excerptFr || ""; $("excerpt-en").value = item?.excerptEn || "";
  $("body-fr").value = item?.bodyFr || ""; $("body-en").value = item?.bodyEn || "";
  $("image-url").value = item?.imageUrl || ""; setPreview(item?.imageUrl || "");
  $("editor-kicker").textContent = item ? "Modification" : "Nouvelle actualité";
  $("editor-title").textContent = item ? "Modifier l’actualité" : "Créer l’actualité";
  $("editor-error").textContent = ""; editor.hidden = false;
  if (window.innerWidth < 900) editor.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeEditor() { editor.hidden = true; $("editor-error").textContent = ""; }

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = reject; reader.readAsDataURL(file);
  });
}

async function uploadSelectedImage() {
  const file = $("news-image").files[0];
  if (!file) return $("image-url").value;
  if (file.size > 4 * 1024 * 1024) throw new Error("L’image dépasse 4 Mo.");
  const data = await api("/api/media", { method: "POST", body: JSON.stringify({ name: file.name, type: file.type, data: await fileToBase64(file) }) });
  return data.url;
}

async function saveNews(event) {
  event.preventDefault();
  const button = $("save-news"); button.disabled = true; $("editor-error").textContent = "";
  try {
    const imageUrl = await uploadSelectedImage();
    const payload = {
      id: $("news-id").value || undefined, date: $("news-date").value, published: $("news-published").checked,
      titleFr: $("title-fr").value, titleEn: $("title-en").value,
      excerptFr: $("excerpt-fr").value, excerptEn: $("excerpt-en").value,
      bodyFr: $("body-fr").value, bodyEn: $("body-en").value, imageUrl
    };
    await api("/api/news", { method: "POST", body: JSON.stringify(payload) });
    await loadNews(); closeEditor();
  } catch (error) {
    $("editor-error").textContent = error.message === "file_too_large" ? "L’image dépasse 4 Mo." : `Impossible d’enregistrer : ${error.message}`;
  } finally { button.disabled = false; }
}

async function deleteNews(item) {
  if (!confirm(`Supprimer « ${item.titleFr} » ?`)) return;
  try { await api(`/api/news?id=${encodeURIComponent(item.id)}`, { method: "DELETE" }); await loadNews(); if ($("news-id").value === item.id) closeEditor(); }
  catch (error) { alert(`Suppression impossible : ${error.message}`); }
}

$("logout").addEventListener("click", async () => {
  try { await api("/api/auth", { method: "DELETE" }); } finally { window.location.replace("/admin/"); }
});
$("new-news").addEventListener("click", () => openEditor());
$("cancel-edit").addEventListener("click", closeEditor); $("cancel-edit-bottom").addEventListener("click", closeEditor);
$("news-form").addEventListener("submit", saveNews);
$("news-image").addEventListener("change", () => { const file = $("news-image").files[0]; if (file) setPreview(URL.createObjectURL(file)); });
$("remove-image").addEventListener("click", () => { $("news-image").value = ""; $("image-url").value = ""; setPreview(""); });

(async () => {
  try {
    const status = await api("/api/auth");
    if (!status.authenticated) {
      window.location.replace("/admin/");
      return;
    }
    adminApp.hidden = false;
    await loadNews();
  } catch {
    window.location.replace("/admin/");
  }
})();
