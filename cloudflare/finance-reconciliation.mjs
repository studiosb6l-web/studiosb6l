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

export async function readRecordedSettlements(db,period){
 if(!db||!Number.isSafeInteger(period)||period<0)return {status:'unavailable'};
 try{
 // One atomic aggregate query avoids pagination gaps and unbounded result transfers.
 const r=await db.prepare("SELECT COUNT(*) AS n, SUM(CASE WHEN verified=1 AND currency='EUR' THEN 0 ELSE 1 END) AS invalid, SUM(gross_cents) AS gross, SUM(refund_cents) AS refunds, SUM(fee_cents) AS fees FROM hive_finance_settlements WHERE period_start=?").bind(period).first();
 if(!r||!Number.isSafeInteger(r.n)||r.n<=0||r.invalid!==0||![r.gross,r.refunds,r.fees].every(v=>Number.isSafeInteger(v)&&v>=0))return {status:'unavailable'};
 const net=r.gross-r.refunds-r.fees;
 if(!Number.isSafeInteger(net))return {status:'unavailable'};
 return {status:'reconciled',grossCents:r.gross,refundCents:r.refunds,feeCents:r.fees,netCents:net,recordCount:r.n,executionAuthorized:false};
 }catch{return {status:'unavailable'};}
}
