// STUDIOSB6L artist submissions — Cloudflare Worker + private R2 + KV.
// Bind R2 bucket as TRACKS, KV namespace as APPLICATIONS. Configure ADMIN_TOKEN secret.
// Never make the R2 bucket public. Publish approved tracks through a separate licensed workflow.
let responseOrigin='';const JSON_HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store'};
const MAX=40*1024*1024,FORMATS=['audio/mpeg','audio/wav','audio/x-wav','audio/flac','audio/ogg','audio/mp4','audio/x-m4a'];
function reply(data,status=200){return new Response(JSON.stringify(data),{status,headers:{...JSON_HEADERS,...(responseOrigin?{'access-control-allow-origin':responseOrigin,'vary':'Origin'}:{})}})}
function clean(s,max=300){return String(s||'').trim().slice(0,max)}
function authorized(req,env){const t=req.headers.get('authorization')||'';return !!env.ADMIN_TOKEN&&t==='Bearer '+env.ADMIN_TOKEN}
export default {async fetch(request,env){const url=new URL(request.url);const path=url.pathname;const origin=request.headers.get('origin');const allowed=origin==='https://www.studiosb6l.com'||origin==='https://studiosb6l.com';if(allowed)responseOrigin=origin;if(request.method==='OPTIONS')return new Response(null,{status:allowed?204:403,headers:allowed?{'access-control-allow-origin':origin,'access-control-allow-methods':'POST,GET,PATCH,OPTIONS','access-control-allow-headers':'Content-Type,Authorization','access-control-max-age':'86400'}:{}});try{
if(origin&&!allowed)return reply({error:'Origin not allowed'},403);if(path==='/api/health')return reply({ok:true,storage:!!env.TRACKS,applications:!!env.APPLICATIONS});
if(path.startsWith('/api/admin/')){if(!authorized(request,env))return reply({error:'Unauthorized'},401);
if(path==='/api/admin/applications'&&request.method==='GET'){const list=await env.APPLICATIONS.list({prefix:'application:',limit:100});const items=await Promise.all(list.keys.map(async k=>JSON.parse(await env.APPLICATIONS.get(k.name))));return reply({items})}
const m=path.match(/^\/api\/admin\/applications\/([a-f0-9-]+)$/);
if(m&&request.method==='PATCH'){const key='application:'+m[1],item=await env.APPLICATIONS.get(key,'json');if(!item)return reply({error:'Not found'},404);const body=await request.json();if(!['pending','approved','rejected'].includes(body.status))return reply({error:'Invalid status'},400);item.status=body.status;item.reviewedAt=new Date().toISOString();await env.APPLICATIONS.put(key,JSON.stringify(item));return reply({ok:true,item})}
return reply({error:'Not found'},404)}
if(path==='/api/artist/apply'&&request.method==='POST'){if(!env.TRACKS||!env.APPLICATIONS)return reply({error:'Storage not configured'},503);
const length=Number(request.headers.get('content-length')||0);if(length>5*MAX+1024*1024)return reply({error:'Request too large'},413);
const form=await request.formData();const artist=clean(form.get('artist'),140),email=clean(form.get('email'),160),country=clean(form.get('country'),120),name=clean(form.get('name'),120),description=clean(form.get('description'),2500),official=clean(form.get('official'),300);
if(!artist||!name||!country||!description||!/^\S+@\S+\.\S+$/.test(email)||form.get('rights')!=='yes'||form.get('privacy')!=='yes')return reply({error:'Required details, rights and privacy consent missing'},400);
if(official&&!/^https:\/\//i.test(official))return reply({error:'Official URL must use HTTPS'},400);
const files=form.getAll('tracks').filter(f=>f instanceof File&&f.size>0);
if(files.length<1||files.length>5)return reply({error:'Select 1 to 5 audio files'},400);
for(const file of files){if(file.size>MAX||!FORMATS.includes(file.type)||!/\.(mp3|wav|flac|ogg|m4a)$/i.test(file.name))return reply({error:'Unsupported audio format or file over 40 MB'},400)}
const id=crypto.randomUUID(),tracks=[];for(let i=0;i<files.length;i++){const file=files[i],ext=file.name.split('.').pop().toLowerCase(),key='pending/'+id+'/'+(i+1)+'.'+ext;await env.TRACKS.put(key,file.stream(),{httpMetadata:{contentType:file.type},customMetadata:{application:id}});tracks.push({name:clean(file.name,180),key,size:file.size,type:file.type})}
const item={id,status:'pending',createdAt:new Date().toISOString(),artist,name,email,country,description,official,tracks,rightsConfirmed:true,privacyConfirmed:true};await env.APPLICATIONS.put('application:'+id,JSON.stringify(item));return reply({ok:true,reference:id,message:'Application received for review; tracks are private.'},201)}
return reply({error:'Not found'},404)}catch(e){return reply({error:'Request could not be processed'},500)}}};
