import {authorize} from './authorization-policy.mjs';
import {financePolicy,quotaPolicy} from './finance-policy.mjs';
// Private read model. Inputs must be supplied by trusted server adapters, never request JSON.
export function privateFinanceSnapshot(session,{ledger,quotas,now}={}){
 if(!authorize(session,'admin:read'))return {status:'forbidden'};
 if(!Number.isSafeInteger(now)||now<0)return {status:'unavailable'};
 const fresh=x=>x?.verified===true&&Number.isSafeInteger(x.observedAt)&&x.observedAt>=0&&x.observedAt<=now&&now-x.observedAt<=300000;
 const valid=fresh(ledger)&&[ledger.netRevenueCents,ledger.freeCashCents,ledger.committedCents,ledger.spentCents].every(v=>Number.isSafeInteger(v)&&v>=0)&&typeof ledger.stopped==='boolean';
 const finance=valid?{status:'verified',observedAt:ledger.observedAt,netRevenueCents:ledger.netRevenueCents,spentCents:ledger.spentCents,committedCents:ledger.committedCents,...financePolicy(ledger)}:{status:'unavailable'};
 const services=(Array.isArray(quotas)?quotas:[]).filter(q=>q&&typeof q.service==='string').map(q=>fresh(q)&&Number.isSafeInteger(q.used)&&q.used>=0&&Number.isSafeInteger(q.limit)&&q.limit>0&&typeof q.stopped==='boolean'?{service:q.service,status:'verified',used:q.used,limit:q.limit,observedAt:q.observedAt,...quotaPolicy({...q,requested:0})}:{service:q.service,status:'unavailable'});
 return {status:'private',finance,services,executionAuthorized:false};
}
