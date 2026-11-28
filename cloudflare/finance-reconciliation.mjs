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
 const result=await db.prepare('SELECT provider, settlement_id, currency, gross_cents, refund_cents, fee_cents, verified FROM hive_finance_settlements WHERE period_start=? LIMIT 1001').bind(period).all();
 const rows=result.results;
 if(!Array.isArray(rows)||rows.length>1000)return {status:'unavailable'};
 return reconcileSettlements(rows.map(r=>({provider:r.provider,id:r.settlement_id,currency:r.currency,grossCents:r.gross_cents,refundCents:r.refund_cents,feeCents:r.fee_cents,verified:r.verified===1})));
 }catch{return {status:'unavailable'};}
}
