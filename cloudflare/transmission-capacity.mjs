import {LIMITS,canReserveQuota} from './ambassador-session-policy.mjs';
// Reserve worst-case usage before issuing any provider room credentials.
// Provider-specific metrics must be supplied from trusted server configuration.
export function participantMinutes(attendees){
 if(!Number.isInteger(attendees)||attendees<1||attendees>LIMITS.participants)throw new RangeError('Invalid capacity');
 return (attendees+1)*LIMITS.durationMs/60000;
}
export function capacityDecision({attendees,stop,metrics,providerVerified}={}){
 if(stop!==false||providerVerified!==true)return {allowed:false,reason:'unavailable'};
 let minutes;try{minutes=participantMinutes(attendees)}catch{return {allowed:false,reason:'capacity'}}
 if(!Array.isArray(metrics)||!metrics.some(m=>m?.metric==='participant_minutes')||new Set(metrics.map(m=>m?.metric)).size!==metrics.length)return {allowed:false,reason:'quota_unknown'};
 const reservations=metrics.map(m=>m?.metric==='participant_minutes'?{...m,requested:Math.max(minutes,m.requested)}:m);
 if(!canReserveQuota(reservations))return {allowed:false,reason:'quota_limit'};
 return {allowed:true,participantMinutes:minutes,reservations};
}
// This is a pure preflight calculation, not a reservation. The caller must
// atomically reserve all metrics, enforce provider hard limits and reconcile usage.
