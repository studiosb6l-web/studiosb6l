// STUDIOSB6L — shared server-side authorization policy.
// Import only into trusted Workers. Never use client-provided role or account state.
export const ROLES=Object.freeze(['artist','producer','promoter','venue','company','student','owner']);
const CAPABILITIES=Object.freeze({
  artist:['profile:read','profile:edit','support:create'],
  producer:['profile:read','profile:edit','support:create'],
  promoter:['profile:read','profile:edit','support:create'],
  venue:['profile:read','profile:edit','support:create'],
  company:['profile:read','profile:edit','support:create'],
  student:['profile:read','profile:edit','support:create'],
  owner:['profile:read','profile:edit','support:create','admin:read','applications:review','support:reply','emergency:control']
});
export function authorize(session,capability){
  if(!session||typeof session!=='object'||session.verified!==true)return false;
  if(!ROLES.includes(session.role)||typeof capability!=='string')return false;
  if(session.disabled===true||session.expiresAt===undefined||!Number.isFinite(session.expiresAt)||session.expiresAt<=Date.now())return false;
  if(session.role==='owner'&&session.mfaVerified!==true)return false;
  return CAPABILITIES[session.role].includes(capability);
}
export function requireCapability(session,capability){
  if(!authorize(session,capability))return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  return null;
}
// session MUST be produced by a trusted backend after validating an authenticated,
// signed session against the session store; never pass browser JSON directly.
