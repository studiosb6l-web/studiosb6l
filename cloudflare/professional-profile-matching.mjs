import {SECTORS} from './professional-profile-schema.mjs';
export const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export const countryKey=value=>{const n=normalize(value);const aliases={portugal:'pt',espanha:'es',espana:'es',spain:'es',franca:'fr',france:'fr',frankreich:'fr',alemanha:'de',germany:'de',deutschland:'de',brasil:'br',brazil:'br',italia:'it',italy:'it','reino unido':'gb','united kingdom':'gb',uk:'gb','estados unidos':'us','united states':'us',usa:'us',canada:'ca',japao:'jp',japan:'jp',china:'cn'};return Object.hasOwn(aliases,n)?aliases[n]:n;};
const list=v=>(Array.isArray(v)?v:[]).map(normalize).filter(Boolean);
const common=(a,b)=>list(a).filter(x=>list(b).includes(x));
export function effectiveProfilePlan(entitlement,now=Date.now()){
 return entitlement&&['pro_monthly','pro_annual'].includes(entitlement.plan)&&entitlement.verified_at>0&&entitlement.verified_at<=now&&entitlement.expires_at>now&&!entitlement.revoked_at&&entitlement.provider_reference?'pro':'free';
}
export function matchProfessionalProfiles(viewer,candidate,{plan='free'}={}){
 if(!viewer||!candidate||viewer.id===candidate.id||!Object.hasOwn(SECTORS,viewer.kind)||!Object.hasOwn(SECTORS,candidate.kind)||!viewer.publishConsent||!candidate.publishConsent||!viewer.matchingConsent||!candidate.matchingConsent)return null;
 const needed=common(viewer.seeking,candidate.services),offered=common(viewer.services,candidate.seeking);if(!needed.length&&!offered.length)return null;
 const country=countryKey(viewer.country)===countryKey(candidate.country),city=country&&normalize(viewer.city)===normalize(candidate.city);
 const remote=viewer.workMode!=='onsite'&&candidate.workMode!=='onsite';
 if(plan!=='pro'&&!country)return null;if(!country&&!remote)return null;
 const vi=viewer.details?.instruments||viewer.details?.disciplines,ci=candidate.details?.instruments||candidate.details?.disciplines;
 if([...needed,...offered].includes('teaching')&&list(vi).length&&list(ci).length&&!common(vi,ci).length)return null;
 let score=50+(country?15:0)+(city?10:0);const reasons=[needed.length?'Serviço procurado disponível':'Oportunidade para o teu serviço',country?'Mesmo país':'Colaboração à distância'];
 if(plan==='pro'){
  for(const key of ['instruments','genres','languages','formats'])if(common(viewer.details?.[key],candidate.details?.[key]).length){score+=5;reasons.push({instruments:'Instrumentos compatíveis',genres:'Géneros compatíveis',languages:'Idiomas compatíveis',formats:'Formatos compatíveis'}[key]);}
  if(candidate.available){score+=5;reasons.push('Disponibilidade indicada');}
 }
 return{score:Math.min(100,score),needed,offered,reasons};
}
export function rankProfessionalProfiles(viewer,candidates,{plan='free'}={}){
 return candidates.map(c=>({profile:c,match:matchProfessionalProfiles(viewer,c,{plan})})).filter(x=>x.match).sort((a,b)=>b.match.score-a.match.score||a.profile.id.localeCompare(b.profile.id)).slice(0,plan==='pro'?30:3);
}
