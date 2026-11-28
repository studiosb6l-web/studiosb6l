// Pure reconciliation. No provider calls, writes, or spending authorization.
// Inputs must originate from independently verified server-side settlement records.
export function reconcileSettlements(records){
 if(!Array.isArray(records)||!records.length)return {status:'unavailable'};
 const seen=new Set(), totals={grossCents:0,refundCents:0,feeCents:0,netCents:0};
 for(const r of records){
 if(!r||r.verified!==true||r.currency!=='EUR'||typeof r.provider!=='string'||!r.provider||typeof r.id!=='string'||!r.id)return {status:'unavailable'};
 const key=JSON.stringify([r.provider,r.id]);
 if(seen.has(key))return {status:'unavailable'};
 seen.add(key);
 if(![r.grossCents,r.refundCents,r.feeCents].every(v=>Number.isSafeInteger(v)&&v>=0))return {status:'unavailable'};
 const net=r.grossCents-r.refundCents-r.feeCents;
 if(!Number.isSafeInteger(net))return {status:'unavailable'};
 for(const k of ['grossCents','refundCents','feeCents'])totals[k]+=r[k];
 totals.netCents+=net;
 if(!Object.values(totals).every(Number.isSafeInteger))return {status:'unavailable'};
 }
 return {status:'reconciled',...totals,recordCount:seen.size,executionAuthorized:false};
}
