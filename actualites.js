const newsRoot = document.querySelector("[data-news-list]");
const newsState = document.querySelector("[data-news-state]");
let ptrcNews = [];

function currentLanguage() { return localStorage.getItem("ptrc-language") === "en" ? "en" : "fr"; }
function pick(item, key, lang) { return (lang === "en" && item[`${key}En`]) || item[`${key}Fr`] || ""; }
function formatNewsDate(date, lang) {
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00`));
}
function paragraphs(value) { return String(value || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean); }

function renderNews() {
  if (!newsRoot) return;
  const lang = currentLanguage();
  newsRoot.replaceChildren();
  if (!ptrcNews.length) {
    newsState.textContent = lang === "en" ? "No news published yet." : "Aucune actualité publiée pour le moment.";
    newsState.hidden = false; return;
  }
  newsState.hidden = true;
  ptrcNews.forEach((item) => {
    const article = document.createElement("article"); article.className = "news-article";
    if (item.imageUrl) { const img = document.createElement("img"); img.className = "news-article-image"; img.src = item.imageUrl; img.alt = pick(item, "title", lang); img.loading = "lazy"; article.append(img); }
    const content = document.createElement("div"); content.className = "news-article-content";
    const date = document.createElement("time"); date.dateTime = item.date; date.textContent = formatNewsDate(item.date, lang);
    const title = document.createElement("h2"); title.textContent = pick(item, "title", lang);
    content.append(date, title);
    const excerpt = pick(item, "excerpt", lang); if (excerpt) { const p = document.createElement("p"); p.className = "news-article-excerpt"; p.textContent = excerpt; content.append(p); }
    const body = document.createElement("div"); body.className = "news-article-body";
    paragraphs(pick(item, "body", lang)).forEach((value) => { const p = document.createElement("p"); p.textContent = value; body.append(p); });
    if (body.childNodes.length) content.append(body);
    article.append(content); newsRoot.append(article);
  });
}

async function loadNews() {
  if (!newsRoot) return;
  try {
    const response = await fetch("/api/news", { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    ptrcNews = await response.json(); renderNews();
  } catch {
    newsState.textContent = currentLanguage() === "en" ? "News is temporarily unavailable." : "Les actualités sont temporairement indisponibles.";
    newsState.hidden = false;
  }
}

document.querySelectorAll(".lang-button").forEach((button) => button.addEventListener("click", () => setTimeout(renderNews, 0)));
loadNews();
