// Aggregate authorized market evidence only; no scraping or automated decisions.
export function marketGaps(records,now){
 if(!Array.isArray(records)||!Number.isSafeInteger(now)||now<0)return [];
 const groups=new Map(),seen=new Set();
 for(const r of records){
 if(!r||r.verified!==true||r.sourceAuthorized!==true||r.aggregateUseAllowed!==true||typeof r.evidenceId!=='string'||!r.evidenceId.trim()||seen.has(r.evidenceId)||typeof r.category!=='string'||!r.category.trim()||!Number.isSafeInteger(r.observedAt)||r.observedAt<0||r.observedAt>now||now-r.observedAt>90*86400000||typeof r.unmet!=='boolean')continue;
 seen.add(r.evidenceId);const key=r.category.trim().toLowerCase();const g=groups.get(key)||{category:key,observations:0,unmet:0};g.observations++;if(r.unmet)g.unmet++;groups.set(key,g);
 }
 return [...groups.values()].filter(g=>g.observations>=20&&g.unmet>=10).map(g=>({...g,unmetShare:g.unmet/g.observations,authorized:false})).sort((a,b)=>b.unmetShare-a.unmetShare||a.category.localeCompare(b.category));
}
