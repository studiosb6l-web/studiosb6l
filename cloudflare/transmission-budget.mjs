// Internal policy: inputs must come from trusted membership and usage storage.
import {effectivePlan, attendanceLimits, LIMITS} from './ambassador-session-policy.mjs';
export function transmissionBudget(membership, now=Date.now()) {
 const limits=attendanceLimits(membership,now);
 return Object.freeze({...limits,minutes:limits.monthly*45});
}
export function canReserveTransmission({membership,role,minutes,usedMinutes,reservedMinutes,monthlySessions,weeklySessions},now=Date.now()) {
 const plan=effectivePlan(membership,now),budget=transmissionBudget(membership,now);
 if(!plan||!['host','attendee'].includes(role)||(role==='host'&&plan!=='PRO_BUSINESS'))return false;
 if(![minutes,usedMinutes,reservedMinutes,monthlySessions,weeklySessions].every(Number.isSafeInteger))return false;
 return minutes>0&&minutes<=LIMITS.durationMs/60000&&usedMinutes>=0&&reservedMinutes>=0&&monthlySessions>=0&&weeklySessions>=0
 &&usedMinutes+reservedMinutes+minutes<=budget.minutes&&monthlySessions<budget.monthly&&weeklySessions<budget.weekly;
}
// UTC periods are server-derived; ISO weeks must not reset on a month boundary.
export function transmissionPeriods(now=Date.now()) {
 if(!Number.isSafeInteger(now)||now<0)throw new TypeError('Invalid server time');
 const date=new Date(now);
 if(!Number.isFinite(date.getTime()))throw new TypeError('Invalid server time');
 const month=date.toISOString().slice(0,7);
 date.setUTCHours(0,0,0,0);
 date.setUTCDate(date.getUTCDate()-((date.getUTCDay()+6)%7));
 return {month,week:date.toISOString().slice(0,10)};
}
