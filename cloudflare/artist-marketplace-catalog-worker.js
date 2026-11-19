// STUDIOSB6L artist marketplace public catalog. Deploy with D1 binding DB.
// Never publishes pending/rejected tracks. Checkout and payouts remain disabled until signed provider webhooks.
const ORIGIN='https://www.studiosb6l.com';
const cors={'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Methods':'GET, OPTIONS','Vary':'Origin','Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=60'};
const reply=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:cors});
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(request.method!=='GET')return reply({error:'Method not allowed'},405);
 if(url.pathname==='/health')return reply({service:'artist-marketplace',database:!!env.DB,checkout_enabled:false});
 if(url.pathname!=='/api/catalog')return reply({error:'Not found'},404);
 if(!env.DB)return reply({error:'Catalog unavailable'},503);
 const limit=Math.min(Math.max(parseInt(url.searchParams.get('limit')||'30',10)||30,1),100);
 const offset=Math.min(Math.max(parseInt(url.searchParams.get('offset')||'0',10)||0,0),10000);
 try{
 const {results}=await env.DB.prepare(`SELECT t.id,t.artist_id,t.title,t.price_cents,t.currency,t.cover_key,a.name AS artist_name FROM marketplace_tracks t JOIN artists a ON a.id=t.artist_id WHERE t.status='approved' AND t.approved_at IS NOT NULL AND t.rights_confirmed_at IS NOT NULL AND a.status='approved' ORDER BY t.approved_at DESC,t.id DESC LIMIT ? OFFSET ?`).bind(limit,offset).all();
 return reply({tracks:results,limit,offset,checkout_enabled:false});
 }catch(e){console.error('Marketplace catalog error',e);return reply({error:'Catalog unavailable'},503)}
}};
