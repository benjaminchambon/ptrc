const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-6-luna";

export const PTRC_KNOWLEDGE = `
Paris Tag Rugby Club (PTRC)
- Club de Tag Rugby créé en 2013, basé à Paris / Val-de-Marne.
- Le Tag Rugby est une variante du rugby sans plaquage : les défenseurs retirent un tag porté à la ceinture du porteur de balle.
- Le jeu est mixte, sans contact volontaire, accessible aux débutants et à tous les niveaux.
- Les passes se font vers l'arrière. Après six tags, la possession change de camp.

Entraînements
- Tous les lundis de septembre à juin.
- Rendez-vous à 19h30 ; entraînement de 19h45 à 21h55.
- Stade Gabriel Péri, 94 rue Gabriel Péri, 94400 Vitry-sur-Seine.
- RER C : Les Ardoines, environ 10 minutes à pied.
- Métro ligne 7 jusqu'à Mairie d'Ivry puis bus 182 jusqu'à Danielle Casanova.
- Douches disponibles sur place.
- Une tenue de sport et des chaussures adaptées suffisent. Aucun équipement spécifique n'est nécessaire pour une première séance.
- Les deux premières séances sont gratuites et sans engagement.
- Les débutants sont les bienvenus. Le site indique un accueil des nouveaux le premier lundi du mois.
- Réservation des séances et événements : https://www.meetup.com/paris-tag-rugby-meetup/

Adhésion
- Cotisation : 70 € l'année ou 40 € la demi-saison.
- Adhésion : https://grand-paris-tag-rugby.s2.yapla.com/fr/adh-sion-ptrc-2026-2027-21416/

Club
- Le club est affilié à la Fédération Française de Tag Rugby (FFTR).
- Apéronome est un partenaire du club.
- Instagram : https://www.instagram.com/paristagrugby/
- Les actualités sont publiées sur /actualites.html.

Tournois 2027 annoncés sur le site
- Bourges : février 2027.
- Paris : mars 2027.
- Londres : avril 2027.
- Fronton : juin 2027.
- Billom : juillet 2027.
- Antibes : septembre 2027.

Contact
- Pour une première séance, le site recommande de réserver sur Meetup.
- Pour une question non couverte, utiliser la page /contact.html.
`.trim();

export function getAiConfig() {
  return {
    apiKey: String(process.env.OPENAI_API_KEY || "").trim(),
    model: String(process.env.OPENAI_MODEL || DEFAULT_MODEL).trim() || DEFAULT_MODEL,
    ready: Boolean(String(process.env.OPENAI_API_KEY || "").trim())
  };
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) return payload.output_text.trim();
  const parts = [];
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === "output_text" && typeof content.text === "string") parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

export async function createAiResponse({ instructions, input, maxOutputTokens = 400 }) {
  const config = getAiConfig();
  if (!config.ready) {
    const error = new Error("ai_not_configured");
    error.status = 503;
    throw error;
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "authorization": `Bearer ${config.apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: config.model,
      instructions,
      input,
      max_output_tokens: maxOutputTokens,
      store: false
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("OpenAI API error", response.status, payload?.error?.type || payload?.error?.code || "unknown");
    const error = new Error("ai_request_failed");
    error.status = response.status >= 500 ? 502 : 500;
    throw error;
  }

  const text = extractOutputText(payload);
  if (!text) {
    const error = new Error("ai_empty_response");
    error.status = 502;
    throw error;
  }
  return text;
}

export function parseJsonObject(text) {
  const cleaned = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try { return JSON.parse(cleaned); } catch {}
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
  throw new Error("invalid_ai_json");
}
