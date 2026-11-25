import {SECTORS,SERVICES} from './professional-profile-schema.mjs';
export function normalizeAuthorizedFeed(records,source,now=Date.now()){
 if(source?.authorized!==true||!Array.isArray(records)||!Array.isArray(source.allowedOrigins))return [];
 const out=[],seen=new Set();
 for(const r of records.slice(0,100)){
  if(!r||r.public!==true||r.status!=='verified'||typeof r.id!=='string'||!r.id||r.id.length>120||!['offer','request','news'].includes(r.type)||!Number.isSafeInteger(r.expiresAt)||r.expiresAt<=now||r.expiresAt>now+90*86400000)continue;
  let url;try{url=new URL(r.url);}catch{continue;}
  if(url.protocol!=='https:'||url.username||url.password||!source.allowedOrigins.includes(url.origin))continue;
  if(typeof r.title!=='string'||!r.title.trim()||typeof source.id!=='string'||!/^[a-z0-9_-]{1,40}$/.test(source.id))continue;
  const id=source.id+':'+r.id;if(seen.has(id))continue;seen.add(id);
  const keys=(v,dict)=>Array.isArray(v)?[...new Set(v.filter(k=>typeof k==='string'&&Object.hasOwn(dict,k)))].slice(0,20):[];
  out.push({id,title:r.title.trim().slice(0,200),type:r.type,url:url.href,expiresAt:r.expiresAt,sourceAuthorized:true,public:true,status:'verified',sectors:keys(r.sectors,SECTORS),services:keys(r.services,SERVICES),country:typeof r.country==='string'?r.country.slice(0,80):'',remote:r.remote===true,general:r.general===true,commercial:r.commercial===true,genres:Array.isArray(r.genres)?r.genres.filter(g=>typeof g==='string').slice(0,20).map(g=>g.slice(0,60)):[]});
 }
 return out;
}
