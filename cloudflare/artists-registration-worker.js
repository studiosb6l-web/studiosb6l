// STUDIOSB6L — registration endpoint. Deploy as Cloudflare Worker with D1 binding DB.
// Automatic validation means format, duplicate and abuse checks; publication requires approval.
const ORIGIN='https://www.studiosb6l.com';
const headers={'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin','Content-Type':'application/json; charset=utf-8'};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
export default {async fetch(request,env){
const url=new URL(request.url);
if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
if(url.pathname==='/')return reply({platform:'STUDIOSB6L',service:'Artists API',status:'online',database:env.DB?'configured':'missing'});
if(url.pathname!=='/api/applications'||request.method!=='POST')return reply({error:'Route not found'},404);
if(request.headers.get('Origin')!==ORIGIN)return reply({error:'Origin not allowed'},403);
if(!env.DB)return reply({error:'Database unavailable'},503);
if(Number(request.headers.get('Content-Length')||0)>12000)return reply({error:'Request too large'},413);
let body;try{body=await request.json()}catch{return reply({error:'Invalid JSON'},400)}
const clean=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
const name=clean(body.name,120),email=clean(body.email,200).toLowerCase(),country=clean(body.country,100),biography=clean(body.biography,1500),website=clean(body.website,500),type=clean(body.type,60);
if(!['Artista','Banda','Produtor ou realizador','Promotor ou sala','Empresa'].includes(type)||name.length<2||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||body.consent!==true)return reply({error:'Invalid application'},422);
if(website){try{const u=new URL(website);if(!['https:','http:'].includes(u.protocol))throw 0}catch{return reply({error:'Invalid website'},422)}}
try{
await env.DB.prepare("INSERT INTO artists (name,email,country,biography,status) VALUES (?,?,?,?,'pending')").bind(name,email,country,JSON.stringify({type,biography,website})).run();
return reply({success:true,status:'pending',message:'Application received for review'},201);
}catch(err){if(/UNIQUE constraint failed/i.test(String(err)))return reply({error:'Email already registered'},409);console.error('Application database error',err);return reply({error:'Unable to save application'},500)}
}};