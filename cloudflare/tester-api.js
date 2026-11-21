// STUDIOSB6L tester API — deploy as Cloudflare Worker route www.studiosb6l.com/api/tester/*
// Configure secrets TESTER_PASSWORD and SESSION_SECRET (at least 32 random characters).
// Configure variable TESTER_USERNAME=IZA2026. Never place passwords in GitHub.
const enc = new TextEncoder();
const json = (obj,status=200,extra={}) => new Response(JSON.stringify(obj),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff",...extra}});
const b64 = bytes => btoa(String.fromCharCode(...bytes)).replace(/\\+/g,"-").replace(/\\//g,"_").replace(/=+$/,"");
const from64 = str => Uint8Array.from(atob(str.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
async function sign(text,secret){const key=await crypto.subtle.importKey("raw",enc.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return b64(new Uint8Array(await crypto.subtle.sign("HMAC",key,enc.encode(text))))}
async function equal(a,b){const aa=enc.encode(a),bb=enc.encode(b);let diff=aa.length^bb.length;for(let i=0;i<Math.max(aa.length,bb.length);i++)diff|=(aa[i]||0)^(bb[i]||0);return diff===0}
async function session(request,env){const cookie=request.headers.get("Cookie")||"";const value=cookie.split(";").map(x=>x.trim()).find(x=>x.startsWith("b6l_tester="))?.slice(11);if(!value)return null;const parts=value.split(".");if(parts.length!==2)return null;const expected=await sign(parts[0],env.SESSION_SECRET);if(!await equal(expected,parts[1]))return null;try{const payload=JSON.parse(new TextDecoder().decode(from64(parts[0])));return payload.role==="tester"&&payload.exp>Date.now()&&payload.username===env.TESTER_USERNAME?payload:null}catch{return null}}
export default {async fetch(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith("/api/tester/"))return json({error:"Not found"},404);
 if(!env.TESTER_USERNAME||!env.TESTER_PASSWORD||!env.SESSION_SECRET||env.SESSION_SECRET.length<32)return json({error:"Service not configured"},503);
 if(request.method==="GET"&&path==="/api/tester/session"){const user=await session(request,env);return json(user?{authenticated:true,role:"tester",username:user.username}:{authenticated:false})}
 if(request.method==="POST"&&path==="/api/tester/logout")return json({ok:true},200,{"Set-Cookie":"b6l_tester=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Strict"});
 if(request.method==="POST"&&path==="/api/tester/login"){
  if(request.headers.get("Origin")!==url.origin)return json({error:"Forbidden"},403);
  if(!request.headers.get("Content-Type")?.startsWith("application/json"))return json({error:"Invalid content type"},415);
  const length=Number(request.headers.get("Content-Length")||0);if(length>2048)return json({error:"Too large"},413);
  let body;try{body=await request.json()}catch{return json({error:"Invalid request"},400)}
  const username=String(body.username||""),password=String(body.password||"");
  if(username.length>100||password.length>256)return json({error:"Invalid credentials"},401);
  if(!await equal(username,env.TESTER_USERNAME)||!await equal(password,env.TESTER_PASSWORD))return json({error:"Invalid credentials"},401);
  const payload=b64(enc.encode(JSON.stringify({role:"tester",username,exp:Date.now()+4*3600*1000})));
  const token=payload+"."+await sign(payload,env.SESSION_SECRET);
  return json({authenticated:true,role:"tester",username},200,{"Set-Cookie":`b6l_tester=${token}; Path=/; Max-Age=14400; Secure; HttpOnly; SameSite=Strict`});
 }
 return json({error:"Not found"},404);
}};