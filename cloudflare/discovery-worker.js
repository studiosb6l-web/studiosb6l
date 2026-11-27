// B6L Discovery Worker. Separate from the artists registration Worker.
// Set D1 binding DB, deploy, migrate schema, then enable approved RSS/Atom sources.
// Cloudflare Cron runs scheduled() even when no user is browsing.
const ORIGIN='https://www.studiosb6l.com';
const json=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':ORIGIN,'Vary':'Origin','Cache-Control':'no-store'}});
const strip=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/&(?:amp|lt|gt|quot|apos);/g,' ').replace(/\s+/g,' ').trim();
const field=(s,tag)=>{const m=s.match(new RegExp('<(?:[\\w-]+:)?'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?'+tag+'>','i'));return strip(m?.[1]||'')};
async function ingest(env){
 if(!env.DB||env.STOP_SERVICE==='true'||env.PREVIEW_ISOLATED==='true')return;
 const sources=await env.DB.prepare('SELECT id,name,feed_url,category FROM discovery_sources WHERE enabled=1 LIMIT 30').all();
 for(const source of sources.results||[]){
  try{
   const u=new URL(source.feed_url);
   if(u.protocol!=='https:'||!env.ALLOWED_FEED_HOSTS?.split(',').map(x=>x.trim()).includes(u.hostname))throw Error('Host not allowlisted');
   const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),8000);
   let response;try{response=await fetch(u.toString(),{signal:ctrl.signal,redirect:'error',headers:{Accept:'application/rss+xml, application/atom+xml, application/xml, text/xml'}})}finally{clearTimeout(timeout)}
   if(!response.ok)throw Error('Feed HTTP '+response.status);
   if(Number(response.headers.get('content-length')||0)>1000000)throw Error('Feed too large');
   const xml=(await response.text()).slice(0,1000000);
   const entries=[...xml.matchAll(/<(item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi)].slice(0,30);
   for(const match of entries){
    const raw=match[2],title=field(raw,'title').slice(0,250),summary=field(raw,'description').slice(0,1000)||field(raw,'summary').slice(0,1000);
    const href=raw.match(/<link\b[^>]*href=["']([^"']+)["']/i)?.[1]||field(raw,'link');
    const guid=field(raw,'guid')||field(raw,'id')||href;
    if(!title||!guid||!href)continue;
    let link;try{link=new URL(href);if(link.protocol!=='https:')continue}catch{continue}
    await env.DB.prepare("INSERT INTO opportunities(source_id,external_id,title,summary,url,category,status) VALUES(?,?,?,?,?,?,'pending') ON CONFLICT(source_id,external_id) DO UPDATE SET title=excluded.title,summary=excluded.summary,updated_at=CURRENT_TIMESTAMP").bind(source.id,String(guid).slice(0,500),title,summary,link.toString(),source.category).run();
   }
   await env.DB.prepare('UPDATE discovery_sources SET last_checked_at=CURRENT_TIMESTAMP,last_error=NULL WHERE id=?').bind(source.id).run();
  }catch(e){console.error('Feed error',source.id,String(e));await env.DB.prepare('UPDATE discovery_sources SET last_error=?,last_checked_at=CURRENT_TIMESTAMP WHERE id=?').bind(String(e).slice(0,250),source.id).run()}
 }
}
export default {
 async scheduled(event,env,ctx){ctx.waitUntil(ingest(env))},
 async fetch(request,env){
  const u=new URL(request.url);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Methods':'GET,OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});
  if(!env.DB)return json({error:'D1 binding missing'},503);
  if(u.pathname==='/health')return json({service:'B6L Discovery',database:'configured'});
  if(u.pathname==='/api/opportunities'&&request.method==='GET'){
   const data=await env.DB.prepare("SELECT o.id,o.title,o.summary,o.url,o.category,o.verified_at,s.name AS source FROM opportunities o JOIN discovery_sources s ON s.id=o.source_id WHERE s.enabled=1 AND o.status='verified' AND o.verified_at IS NOT NULL AND o.expires_at > CURRENT_TIMESTAMP ORDER BY o.verified_at DESC LIMIT 100").all();
   return json(data.results||[]);
  }
  // No anonymous messaging or notification endpoints: identity verification must be implemented first.
  return json({error:'Not found'},404);
 }
};
