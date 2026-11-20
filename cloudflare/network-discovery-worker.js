// STUDIOSB6L public discovery API (Cloudflare Worker module).
// Deploy separately with D1 binding DB after applying migration 001.
// Read-only: no private profiles, applications, messages or payment data.
const ORIGIN = 'https://www.studiosb6l.com';
const json = (data, status=200) => new Response(JSON.stringify(data), {
 status, headers: {'Content-Type':'application/json; charset=utf-8',
 'Access-Control-Allow-Origin':ORIGIN,'Vary':'Origin',
 'Cache-Control': status===200?'public, max-age=60':'no-store',
 'X-Content-Type-Options':'nosniff'}
});
const clean = (value, max=80) => (value || '').trim().slice(0,max);
export default {
 async fetch(request, env) {
  if(request.method!=='GET') return json({error:'Method not allowed'},405);
  const url = new URL(request.url);
  if(!['/api/network/talents','/api/network/opportunities'].includes(url.pathname))
   return json({error:'Not found'},404);
  if(!env.DB) return json({error:'Database not configured'},503);
  const limit = Math.min(30, Math.max(1, Number.parseInt(url.searchParams.get('limit')||'12',10)||12));
  const page = Math.min(1000,Math.max(1,Number.parseInt(url.searchParams.get('page')||'1',10)||1));
  const offset = (page-1)*limit;
  const country = clean(url.searchParams.get('country'),100);
  const query = clean(url.searchParams.get('q'),80).replace(/[\\%_]/g, '\\$&');
  try {
   if(url.pathname.endsWith('/talents')) {
    const role=clean(url.searchParams.get('role'),20);
    if(role && !['artist','producer','promoter','school','student','company'].includes(role))
     return json({error:'Invalid role'},400);
    const result=await env.DB.prepare(`
     SELECT id,display_name,role,country,biography FROM network_accounts
     WHERE visibility='public' AND verification_status='verified'
     AND (?1='' OR country=?1) AND (?2='' OR role=?2)
     AND (?3='' OR display_name LIKE ?3 ESCAPE '\\')
     ORDER BY display_name ASC LIMIT ?4 OFFSET ?5
    `).bind(country,role,query?'%'+query+'%':'',limit,offset).all();
    return json({items:result.results||[],page,limit});
   }
   const category=clean(url.searchParams.get('category'),80);
   const result=await env.DB.prepare(`
    SELECT o.id,o.title,o.category,o.country,o.description,o.deadline,o.created_at
    FROM network_opportunities o JOIN network_accounts a ON a.id=o.owner_id
    WHERE o.status='published' AND a.verification_status='verified'
    AND (?1='' OR o.country=?1) AND (?2='' OR o.category=?2)
    AND (?3='' OR o.title LIKE ?3 ESCAPE '\\')
    ORDER BY o.created_at DESC LIMIT ?4 OFFSET ?5
   `).bind(country,category,query?'%'+query+'%':'',limit,offset).all();
   return json({items:result.results||[],page,limit});
  } catch(e) {
   console.error('Network discovery database error',e);
   return json({error:'Discovery unavailable'},503);
  }
 }
};
