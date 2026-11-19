// STUDIOSB6L artists API — Cloudflare Worker
// Required D1 binding: DB. Optional: ALLOWED_ORIGIN (e.g. https://www.studiosb6l.com).
// Deploy only after D1 binding and schema are verified.
const json = (data, status=200, headers={}) => new Response(JSON.stringify(data), {status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const allowed = env.ALLOWED_ORIGIN || 'https://www.studiosb6l.com';
    const cors = {'access-control-allow-origin':allowed,'vary':'Origin','access-control-allow-methods':'GET, POST, OPTIONS','access-control-allow-headers':'Content-Type'};
    if (origin && origin !== allowed) return json({error:'Origin not allowed'},403,cors);
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:cors});
    if (!env.DB) return json({error:'Database binding DB missing'},503,cors);
    const url = new URL(request.url);
    try {
      if (url.pathname === '/health' && request.method === 'GET') return json({ok:true,service:'studiosb6l-artists-api'},200,cors);
      if (url.pathname === '/artists' && request.method === 'GET') {
        const rows = await env.DB.prepare("SELECT id, name, country, biography, photo_url, created_at FROM artists WHERE status = 'approved' ORDER BY created_at DESC LIMIT 100").all();
        return json({artists:rows.results || []},200,cors);
      }
      if (url.pathname === '/artists/register' && request.method === 'POST') {
        const len = Number(request.headers.get('content-length') || 0);
        if (len > 12000) return json({error:'Payload too large'},413,cors);
        let body;
        try { body = await request.json(); } catch { return json({error:'Invalid JSON'},400,cors); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) return json({error:'Invalid input'},400,cors);
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const country = typeof body.country === 'string' ? body.country.trim() : '';
        const biography = typeof body.biography === 'string' ? body.biography.trim() : '';
        const photo_url = typeof body.photo_url === 'string' ? body.photo_url.trim() : '';
        if (name.length < 2 || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || country.length > 100 || biography.length > 2000 || photo_url.length > 500)
          return json({error:'Invalid registration fields'},400,cors);
        if (photo_url && (!/^https:\/\//i.test(photo_url) || /[<>"']/g.test(photo_url))) return json({error:'Invalid photo URL'},400,cors);
        try {
          await env.DB.prepare("INSERT INTO artists (name,email,country,biography,photo_url,status) VALUES (?,?,?,?,?,'pending')").bind(name,email,country,biography,photo_url).run();
        } catch (e) {
          if (/UNIQUE|constraint/i.test(String(e))) return json({error:'Email already registered'},409,cors);
          throw e;
        }
        return json({ok:true,status:'pending',message:'Registration received for review'},202,cors);
      }
      return json({error:'Not found'},404,cors);
    } catch (e) { console.error('Artists API error',e); return json({error:'Internal server error'},500,cors); }
  }
};
