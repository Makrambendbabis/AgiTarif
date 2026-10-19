// Relais vers l'API OpenAI pour l'assistant de l'Explorateur AgiTarif Data.
// La clé reste côté serveur : variable d'environnement OPENAI_API_KEY (Netlify > Site configuration > Environment variables).
// Optionnel : CHAT_MODEL (version par défaut, ex. gpt-4o-mini), CHAT_ORIGIN (origine autorisée, ex. https://agitarif.netlify.app),
// CHAT_TOKEN (jeton partagé que la page doit envoyer dans l'en-tête x-chat-token).
export default async (req) => {
  const origin = process.env.CHAT_ORIGIN || "*";
  const H = { "content-type": "application/json", "access-control-allow-origin": origin, "access-control-allow-headers": "content-type, x-chat-token", "access-control-allow-methods": "POST, OPTIONS" };
  const out = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: H });
  if (req.method === "OPTIONS") return new Response("", { status: 204, headers: H });
  if (req.method !== "POST") return out({ error: "POST attendu" }, 405);
  if (process.env.CHAT_TOKEN && req.headers.get("x-chat-token") !== process.env.CHAT_TOKEN) return out({ error: "jeton invalide" }, 403);
  const key = process.env.OPENAI_API_KEY;
  if (!key) return out({ error: "OPENAI_API_KEY absente" }, 500);
  let body; try { body = await req.json(); } catch (e) { return out({ error: "JSON invalide" }, 400); }
  const messages = (body.messages || []).slice(-8).map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "").slice(0, 20000) }));
  if (!messages.length) return out({ error: "messages vide" }, 400);
  const model = (body.model && /gpt|o[1-9]/i.test(body.model)) ? body.model : (process.env.CHAT_MODEL || "gpt-4o-mini");
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + key },
    body: JSON.stringify({ model, max_tokens: 700, temperature: 0.2, messages: [{ role: "system", content: String(body.system || "").slice(0, 6000) }, ...messages] })
  });
  const j = await r.json();
  if (!r.ok) return out({ error: j.error ? j.error.message : r.status }, r.status);
  return out({ text: j.choices?.[0]?.message?.content || "" });
};
export const config = { path: "/.netlify/functions/chat" };
