import {eligibleForPublicDiscovery} from './opportunity-keywords.mjs';
import {effectiveProfilePlan,countryKey,normalize} from './professional-profile-matching.mjs';
import {SECTORS,SERVICES} from './professional-profile-schema.mjs';

// Pure selection only: caller must supply verified records and server-side entitlement.
// No network requests, writes, notifications or billing.
export function selectProfessionalOpportunities(profile, records, entitlement, now=Date.now()) {
 if(!profile || profile.matchingConsent!==true || !Object.hasOwn(SECTORS,profile.kind) || !Array.isArray(records)) return [];
 const plan=effectiveProfilePlan(entitlement,now),pro=['pro','master_pro'].includes(plan);
 const interests=new Set([...(profile.services||[]),...(profile.seeking||[])].filter(s=>Object.hasOwn(SERVICES,s)));
 const seen=new Set(), results=[];
 for(const item of records.slice(0,500)){
  if(!eligibleForPublicDiscovery(item)||typeof item.id!=='string'||!item.id||seen.has(item.id)||!Number.isFinite(item.expiresAt)||item.expiresAt<=now) continue;
  if(!['offer','request','news'].includes(item.type)) continue;
  const sectors=Array.isArray(item.sectors)?item.sectors:[];
  const services=Array.isArray(item.services)?item.services:[];
  const direction=item.type==='offer'?profile.seeking:item.type==='request'?profile.services:[...interests];
  const relevant=services.length?services.some(s=>(direction||[]).includes(s)):sectors.includes(profile.kind);
  if(item.commercial===true&&plan!=='master_pro')continue;
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
  results.push({id:item.id,type:item.type,score,local,commercial:item.commercial===true});
 }
 return results.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,pro?30:3);
}

// Summary is restricted to the caller's already eligible, bounded result set.
export function commercialOpportunitySummary(profile,records,entitlement,now=Date.now()){
 if(effectiveProfilePlan(entitlement,now)!=='master_pro')return null;
 const rows=selectProfessionalOpportunities(profile,records,entitlement,now);
 return {generatedAt:now,scope:'personalized_top_30',total:rows.length,offers:rows.filter(r=>r.type==='offer').length,requests:rows.filter(r=>r.type==='request').length,news:rows.filter(r=>r.type==='news').length,commercial:rows.filter(r=>r.commercial===true).length,local:rows.filter(r=>r.local).length};
}
