// STUDIOSB6L intelligence gateway — fail closed, no paid calls by default.
// Deploy separately after configuring Cloudflare Access or equivalent verified admin auth.
// This module deliberately does not expose any public administrative API.
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" };
const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
const FAQ = [
  { words: ["registo", "registro", "inscri", "signup", "register"], answer: "Para criar uma conta, utilize a página oficial de registo. Se surgir um erro, contacte o suporte oficial." },
  { words: ["publica", "upload", "music", "música"], answer: "A publicação depende da validação da conta e da disponibilidade do serviço. Não envie ficheiros privados pelo chat." },
  { words: ["pagamento", "payment", "cartão", "refund"], answer: "Para questões de pagamentos, contacte o suporte através do canal oficial. Nunca envie dados de cartão no chat." }
];
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") return reply(200, { service: "intelligence-gateway", status: "available", ai: "disabled-by-default" });
    if (url.pathname !== "/assist" || request.method !== "POST") return reply(404, { error: "not_found" });
    // Disable endpoint until an operator explicitly enables it; no paid AI calls.
    if (env.ASSISTANT_ENABLED !== "true") return reply(503, { error: "assistant_disabled", charged: false });
    const type = request.headers.get("content-type") || "";
    if (!type.toLowerCase().startsWith("application/json")) return reply(415, { error: "json_required" });
    const length = Number(request.headers.get("content-length") || 0);
    if (length > 2048) return reply(413, { error: "request_too_large" });
    let body;
    try { body = await request.json(); } catch { return reply(400, { error: "invalid_json" }); }
    const message = typeof body?.message === "string" ? body.message.trim().slice(0, 500) : "";
    if (!message) return reply(400, { error: "message_required" });
    // Stateless FAQ: zero AI inference cost. No user data stored or forwarded.
    const normalized = message.toLocaleLowerCase("pt");
    const match = FAQ.find(item => item.words.some(word => normalized.includes(word)));
    return reply(200, { mode: "local-faq", answer: match?.answer || "Consulte a ajuda oficial da STUDIOSB6L ou contacte o suporte.", charged: false });
  }
};
