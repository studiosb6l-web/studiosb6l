// Only explicitly selected customer-facing fields may cross the API boundary.
export function publicTransmissionStatus({plan,usage,periodEnd,session,available},now=Date.now()){
 const host=plan==='PRO_BUSINESS', attend=host||plan==='PRO';
 if(!attend)return {canAttend:false,canHost:false};
 if(!usage||!Number.isSafeInteger(usage.usedMs)||usage.usedMs<0||!Number.isSafeInteger(usage.remainingMs)||usage.remainingMs<0||!Number.isSafeInteger(periodEnd)||periodEnd<=now)throw new Error('Status unavailable');
 const active=session&&Number.isSafeInteger(session.expiresAt)&&Number.isSafeInteger(session.startedAt)&&session.startedAt<=now&&session.expiresAt>now&&session.expiresAt-session.startedAt<=2700000;
 return {canAttend:true,canHost:host,usedMinutes:Math.ceil(usage.usedMs/60000),remainingMinutes:Math.floor(usage.remainingMs/60000),renewsAt:periodEnd,available:available===true,session:active?{elapsedSeconds:Math.floor((now-session.startedAt)/1000),remainingSeconds:Math.max(0,Math.ceil((session.expiresAt-now)/1000)),warning:session.expiresAt-now<=600000}:null};
}
