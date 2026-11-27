// Advisory health triage. No automatic changes, deployments or spending.
export function healthTriage({verified,stopped,checks}={}){
 const base={executionAuthorized:false};
 if(stopped!==false)return {...base,status:'stopped',actions:[]};
 if(verified!==true||!Array.isArray(checks)||!checks.length)return {...base,status:'unknown',actions:[]};
 const actions=[],seen=new Set();
 for(const c of checks){
 if(!c||typeof c.id!=='string'||!c.id.trim()||seen.has(c.id)||!['healthy','degraded','failed'].includes(c.status)||!['security','finance','availability','other'].includes(c.kind))return {...base,status:'unknown',actions:[]};
 seen.add(c.id);
 if(c.status!=='healthy')actions.push({id:c.id,priority:['security','finance'].includes(c.kind)?0:c.status==='failed'?1:2,recommendation:'review_incident'});
 }
 actions.sort((a,b)=>a.priority-b.priority||a.id.localeCompare(b.id));
 return {...base,status:actions.length?'review_required':'healthy',actions};
}
