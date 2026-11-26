import {verifiedRecurringPrice} from './recurring-price-policy.mjs';
// Input must be an independently authenticated provider snapshot, not webhook JSON.
export function recurringEntitlement(snapshot,mapping,previous,now=Date.now()){
 if(!snapshot||typeof snapshot.subscriptionId!=='string'||!snapshot.subscriptionId||typeof snapshot.accountId!=='string'||!snapshot.accountId||!Number.isSafeInteger(snapshot.observedAt)||snapshot.observedAt>now||snapshot.observedAt<=0)return null;
 if(previous&&(previous.subscriptionId!==snapshot.subscriptionId||previous.accountId!==snapshot.accountId||snapshot.observedAt<=previous.observedAt))return null;
 const base={subscriptionId:snapshot.subscriptionId,accountId:snapshot.accountId,observedAt:snapshot.observedAt};
 if(['canceled','unpaid','refunded'].includes(snapshot.status))return {...base,revokedAt:snapshot.observedAt};
 if(snapshot.status!=='active'||snapshot.invoicePaid!==true||snapshot.admissionVerified!==true||!Number.isSafeInteger(snapshot.paidUntil)||snapshot.paidUntil<=now)return null;
 const price=verifiedRecurringPrice(snapshot.price,mapping);
 if(!price)return null;
 return {...base,plan:price.plan,paidUntil:snapshot.paidUntil,revokedAt:null};
}
