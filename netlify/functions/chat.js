// Relais vers l'API Anthropic pour l'assistant de l'Explorateur AgiTarif Data.
// La clé reste côté serveur : variable d'environnement ANTHROPIC_API_KEY (Netlify > Site configuration > Environment variables).
// Optionnel : CHAT_MODEL (version par défaut), CHAT_ORIGIN (origine autorisée, ex. https://agitarif.netlify.app).
export default async (req) => {
  const origin = process.env.CHAT_ORIGIN || "*";
  const H = { "content-type": "application/json", "access-control-allow-origin": origin, "access-control-allow-headers": "content-type", "access-control-allow-methods": "POST, OPTIONS" };
  if (req.method === "OPTIONS") return new Response("", { status: 204, headers: H });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST attendu" }), { status: 405, headers: H });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY absente" }), { status: 500, headers: H });
  let body; try { body = await req.json(); } catch (e) { return new Response(JSON.stringify({ error: "JSON invalide" }), { status: 400, headers: H }); }
  const messages = (body.messages || []).slice(-8).map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "").slice(0, 20000) }));
  if (!messages.length) return new Response(JSON.stringify({ error: "messages vide" }), { status: 400, headers: H });
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: body.model || process.env.CHAT_MODEL || "claude-sonnet-5-5", max_tokens: 700, system: String(body.system || "").slice(0, 6000), messages })
  });
  const j = await r.json();
  if (!r.ok) return new Response(JSON.stringify({ error: j.error ? j.error.message : r.status }), { status: r.status, headers: H });
  return new Response(JSON.stringify({ text: (j.content || []).map(c => c.text || "").join("") }), { status: 200, headers: H });
};
export const config = { path: "/.netlify/functions/chat" };
