// Server-only policy foundation for issue #64. Not wired to production.
import {authorize} from './authorization-policy.mjs';
export const LIMITS=Object.freeze({participants:20,durationMs:45*60000,warningMs:35*60000,monthlyLessons:4,weeklyLessons:1,cooldownMs:20*3600000,videos:3,quotaFraction:0.7});
export function canIssueAmbassadorInvite(session){return session?.role==='owner'&&authorize(session,'admin:read');}
// membership must be loaded from trusted persistence, never request JSON.
export function effectivePlan(membership,now=Date.now()){
 if(!membership||membership.disabled!==false)return null;
 if(membership.ambassadorActive===true)return 'PRO_BUSINESS';
 if(membership.paymentVerified!==true||!Number.isFinite(membership.paidUntil)||membership.paidUntil<=now)return null;
 return ['PRO','PRO_BUSINESS'].includes(membership.plan)?membership.plan:null;
}
export function canHost(membership,now=Date.now()){return effectivePlan(membership,now)==='PRO_BUSINESS';}
export function canAttend(membership,now=Date.now()){return effectivePlan(membership,now)!==null;}
export function canReserveQuota(metrics){
 if(!Array.isArray(metrics)||metrics.length===0)return false;
 return metrics.every(m=>m&&[m.used,m.reserved,m.requested,m.freeLimit].every(Number.isFinite)&&m.used>=0&&m.reserved>=0&&m.requested>=0&&m.freeLimit>0&&m.used+m.reserved+m.requested<=Math.floor(m.freeLimit*LIMITS.quotaFraction));
}
export function sessionPhase(startedAt,now=Date.now()){
 if(!Number.isFinite(startedAt)||!Number.isFinite(now)||now<startedAt)return 'invalid';
 const elapsed=now-startedAt;
 return elapsed>=LIMITS.durationMs?'ended':elapsed>=LIMITS.warningMs?'warning':'live';
}
// Call inside an atomic reservation transaction; no client supplied state.
export function attendanceLimits(membership,now=Date.now()){
 const plan=effectivePlan(membership,now);
 return plan==='PRO_BUSINESS'?{monthly:8,weekly:2}:plan==='PRO'?{monthly:4,weekly:1}:{monthly:0,weekly:0};
}
export function canJoin({membership,invited,activeElsewhere,cooldownUntil,participantCount,startedAt,stop,metrics,monthlyLessonsUsed,weeklyLessonsUsed},now=Date.now()){
 return Number.isInteger(monthlyLessonsUsed)&&monthlyLessonsUsed>=0&&monthlyLessonsUsed<attendanceLimits(membership,now).monthly&&Number.isInteger(weeklyLessonsUsed)&&weeklyLessonsUsed>=0&&weeklyLessonsUsed<attendanceLimits(membership,now).weekly&&stop===false&&invited===true&&activeElsewhere===false&&Number.isFinite(cooldownUntil)&&cooldownUntil<=now&&Number.isInteger(participantCount)&&participantCount>=0&&participantCount<LIMITS.participants&&['live','warning'].includes(sessionPhase(startedAt,now))&&canAttend(membership,now)&&canReserveQuota(metrics);
}
export function cooldownAfter(endedAt){if(!Number.isFinite(endedAt))throw new TypeError('Invalid end time');return endedAt+LIMITS.cooldownMs;}
