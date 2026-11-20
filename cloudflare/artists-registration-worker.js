// STUDIOSB6L registration API — fail-closed safeguards. Deploy with D1 binding DB.
// No payment, robot purchase, profile publication or automatic approval endpoints.
const ORIGIN='https://www.studiosb6l.com';
const HEADERS={'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin','Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const respond=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:HEADERS});
const types=new Set(['Artista','Banda','Produtor ou realizador','Promotor ou sala','Empresa']);
const safeText=(v,max)=>typeof v==='string'&&v.trim().length<=max?v.trim():null;
const validEmail=s=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)&&s.length<=200;
const isPrivateHost=h=>/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?|.*\.local)$/i.test(h);
export default {async fetch(request,env){
  const url=new URL(request.url);
  if(request.method==='OPTIONS')return request.headers.get('Origin')===ORIGIN?new Response(null,{status:204,headers:HEADERS}):respond({error:'Origin not allowed'},403);
  if(url.pathname==='/'&&request.method==='GET')return respond({platform:'STUDIOSB6L',service:'Artists API',status:'online',database:env.DB?'configured':'missing',publication:'manual approval required'});
  if(url.pathname!=='/api/applications'||request.method!=='POST')return respond({error:'Route not found'},404);
  if(request.headers.get('Origin')!==ORIGIN)return respond({error:'Origin not allowed'},403);
  if(!env.DB)return respond({error:'Database unavailable'},503);
  const length=Number(request.headers.get('Content-Length'));
  if(Number.isFinite(length)&&length>12000)return respond({error:'Request too large'},413);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return respond({error:'JSON required'},415);
  let raw;try{raw=await request.text()}catch{return respond({error:'Unreadable request'},400)}
  if(raw.length>12000)return respond({error:'Request too large'},413);
  let body;try{body=JSON.parse(raw)}catch{return respond({error:'Invalid JSON'},400)}
  if(!body||typeof body!=='object'||Array.isArray(body))return respond({error:'Invalid application'},422);
  // Honeypot: legitimate clients leave this empty.
  if(body.company_fax||body.honeypot)return respond({error:'Invalid application'},422);
  const name=safeText(body.name,120),email=safeText(body.email,200)?.toLowerCase(),country=safeText(body.country,100),biography=safeText(body.biography,1500),website=safeText(body.website,500),type=safeText(body.type,60);
  if(!types.has(type)||!name||name.length<2||!email||!validEmail(email)||country===null||biography===null||website===null||body.consent!==true)return respond({error:'Invalid application'},422);
  if(/[<>\u0000-\u001f]/.test(name)||/[\u0000-\u001f]/.test(email))return respond({error:'Invalid application'},422);
  if(website){try{const parsed=new URL(website);if(!['https:','http:'].includes(parsed.protocol)||parsed.username||parsed.password||isPrivateHost(parsed.hostname))throw Error('unsafe')}catch{return respond({error:'Invalid website'},422)}}
  try{
    await env.DB.prepare("INSERT INTO artists (name,email,country,biography,status) VALUES (?,?,?,?,'pending')").bind(name,email,country,JSON.stringify({type,biography,website})).run();
    return respond({success:true,status:'pending',message:'Application received for manual review'},201);
  }catch(err){
    if(/UNIQUE constraint failed/i.test(String(err)))return respond({error:'Email already registered'},409);
    console.error('Application database error',err);return respond({error:'Unable to save application'},500);
  }
}};