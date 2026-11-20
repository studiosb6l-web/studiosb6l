// Pure, deterministic matching foundation. No automated outreach or hiring decisions.
const norm=x=>String(x??'').trim().toLocaleLowerCase();
export function rankOpportunities(profile, opportunities=[]){
 const skills=new Set((profile.skills||[]).map(norm));
 const countries=new Set((profile.countries||[]).map(norm));
 return opportunities.filter(o=>o?.published===true && o?.status==='open').map(o=>{
  const required=(o.requiredSkills||[]).map(norm);
  const matched=required.filter(s=>skills.has(s)).length;
  const skillScore=required.length?matched/required.length:0;
  const countryScore=!o.country||countries.has(norm(o.country))?1:0;
  const score=Math.round(100*(0.85*skillScore+0.15*countryScore));
  return {id:o.id,score,matchedSkills:matched,totalSkills:required.length,explanation:'Skill and geographic preference match; not a hiring recommendation'};
 }).sort((a,b)=>b.score-a.score||String(a.id).localeCompare(String(b.id)));
}
