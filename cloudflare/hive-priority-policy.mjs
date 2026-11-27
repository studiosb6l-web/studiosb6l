// Pure admission policy. Caller must atomically reserve quota before execution.
const priorities = Object.freeze({FINANCE:0,SECURITY:0,GLOBAL_SEARCH:1,SMART_MATCH:1,BUSINESS:1,TALENT:1,GROWTH:2,RETENTION:2,MARKET:2});
export function planHiveJobs({jobs,used,limit,stopped,verified} = {}) {
 if(stopped!==false || verified!==true || !Number.isSafeInteger(used) || used<0 || !Number.isSafeInteger(limit) || limit<=0 || !Array.isArray(jobs)) return [];
 const ceiling=Math.floor(limit*0.7);
 let remaining=Math.max(0,ceiling-used);
 const seen=new Set();
 const valid=jobs.filter(j=>j && typeof j.id==='string' && j.id.length>0 && Object.hasOwn(priorities,j.engine) && j.paid===false && Number.isSafeInteger(j.units) && j.units>0);
 const selected=[];
 for(const j of valid.sort((a,b)=>priorities[a.engine]-priorities[b.engine])) {
  if(seen.has(j.id)) continue;
  seen.add(j.id);
  if(j.units<=remaining){selected.push(j.id);remaining-=j.units;}
 }
 return selected;
}
