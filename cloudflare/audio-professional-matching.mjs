// STUDIOSB6L professional audio matching. No scraping, profiling of private data, or automatic outreach.
// Only consented public/approved profiles and verified opportunities may be considered.
export const norm = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const list = v => (Array.isArray(v) ? v : []).map(norm).filter(Boolean);
const overlaps = (a,b) => a.some(x => b.includes(x));
const aliases = Object.freeze({
  mixing:['mixing','mixagem','mistura','mezcla','mixage'],
  mastering:['mastering','masterizacao','masterização','masterizacion','masterisation'],
  recording:['recording','gravacao','gravação','grabacion','enregistrement'],
  production:['production','producao musical','produção musical','produccion musical','music production'],
  postproduction:['postproduction','pos-producao','pós-produção','postproduccion','audio post production'],
  live_sound:['live sound','som ao vivo','sonido en vivo','sonorisation']
});
export function canonicalSkill(value){
  const n=norm(value);
  return Object.entries(aliases).find(([,values])=>values.map(norm).includes(n))?.[0] ?? n;
}
export function matchAudioProfessional(profile, request){
  if (!profile || !request || profile.moderation !== 'approved' || profile.public !== true || profile.matching_consent !== true) return null;
  if (request.status !== 'verified' || request.matching_consent !== true) return null;
  const skills=list(profile.skills).map(canonicalSkill), required=list(request.required_skills).map(canonicalSkill);
  if (!required.length || !skills.length || !overlaps(skills,required)) return null;
  if (request.remote_allowed === false && profile.remote_only === true) return null;
  if (request.remote_allowed === false && norm(request.country) && norm(profile.country)!==norm(request.country)) return null;
  const matches=required.filter(x=>skills.includes(x));
  const skillScore=Math.round(65*matches.length/required.length);
  const countryMatch=Boolean(norm(profile.country) && norm(profile.country)===norm(request.country));
  const genres=list(profile.genres), requestedGenres=list(request.genres);
  const genreMatch=Boolean(requestedGenres.length && overlaps(genres,requestedGenres));
  const formatMatch=Boolean(list(request.formats).length && overlaps(list(profile.formats),list(request.formats)));
  const score=Math.min(100,skillScore+(countryMatch?10:0)+(genreMatch?10:0)+(formatMatch?10:0)+(profile.available===true?5:0));
  return {score,matchedSkills:matches,reason:'Verified opportunity and approved opt-in profile; skill compatibility'+(countryMatch?', country match':'')+(genreMatch?', genre match':'')+(formatMatch?', format match':'')};
}
export function rankAudioProfessionals(profiles,request,{limit=20,minScore=40}={}){
  return (Array.isArray(profiles)?profiles:[]).map(profile=>({profileId:profile.id,match:matchAudioProfessional(profile,request)}))
    .filter(x=>x.match && x.match.score>=minScore)
    .sort((a,b)=>b.match.score-a.match.score || String(a.profileId).localeCompare(String(b.profileId)))
    .slice(0,Math.max(0,Math.min(100,limit)));
}
