const $ = (id) => document.getElementById(id);

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

function goToNewsAdmin() {
  window.location.replace("/admin/news.html");
}

$("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("login-submit");
  $("login-error").textContent = "";
  button.disabled = true;

  try {
    await api("/api/auth", {
      method: "POST",
      body: JSON.stringify({
        email: $("login-email").value,
        password: $("login-password").value
      })
    });
    $("login-password").value = "";
    goToNewsAdmin();
  } catch (error) {
    $("login-password").value = "";
    $("login-error").textContent = error.message === "not_configured"
      ? "L’admin n’est pas encore configuré côté serveur."
      : "Email ou mot de passe incorrect.";
  } finally {
    button.disabled = false;
  }
});

(async () => {
  try {
    const status = await api("/api/auth");
    if (status.authenticated) {
      goToNewsAdmin();
      return;
    }
    if (!status.configured) {
      $("login-error").textContent = "Configuration serveur requise : voir README-ADMIN.md.";
    }
  } catch {
    $("login-error").textContent = "API indisponible. Lance le serveur Node ou déploie sur Netlify.";
  }
})();
