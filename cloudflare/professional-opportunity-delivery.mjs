import {eligibleForPublicDiscovery} from './opportunity-keywords.mjs';
import {effectiveProfilePlan,countryKey,normalize} from './professional-profile-matching.mjs';
import {SECTORS,SERVICES} from './professional-profile-schema.mjs';

// Pure selection only: caller must supply verified records and server-side entitlement.
// No network requests, writes, notifications or billing.
export function selectProfessionalOpportunities(profile, records, entitlement, now=Date.now()) {
 if(!profile || profile.matchingConsent!==true || !Object.hasOwn(SECTORS,profile.kind) || !Array.isArray(records)) return [];
 const pro=effectiveProfilePlan(entitlement,now)==='pro';
 const interests=new Set([...(profile.services||[]),...(profile.seeking||[])].filter(s=>Object.hasOwn(SERVICES,s)));
 const seen=new Set(), results=[];
 for(const item of records.slice(0,500)){
  if(!eligibleForPublicDiscovery(item)||typeof item.id!=='string'||!item.id||seen.has(item.id)||!Number.isFinite(item.expiresAt)||item.expiresAt<=now) continue;
  if(!['offer','request','news'].includes(item.type)) continue;
  const sectors=Array.isArray(item.sectors)?item.sectors:[];
  const services=Array.isArray(item.services)?item.services:[];
  const relevant=sectors.includes(profile.kind)||services.some(s=>interests.has(s));
  const local=Boolean(item.country&&profile.country&&countryKey(item.country)===countryKey(profile.country));
  if(item.type==='news'){
   if(item.general!==true&&(!pro||!relevant)) continue;
  }else{
   if(!relevant) continue;
   if(!local&&(!pro||item.remote!==true||profile.workMode==='onsite')) continue;
  }
  seen.add(item.id);
  const genres=Array.isArray(profile.details?.genres)?profile.details.genres.map(normalize):[];
  const genreMatch=Array.isArray(item.genres)&&item.genres.some(g=>genres.includes(normalize(g)));
  const score= (relevant?40:10)+(local?20:0)+(pro&&genreMatch?15:0);
  results.push({id:item.id,type:item.type,score});
 }
 return results.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,pro?30:3);
}
