// Read only. No synthetic balances, automatic spending or ledger writes.
export async function readVerifiedFinanceLedger(db,now){
 if(!db||!Number.isSafeInteger(now)||now<0)return undefined;
 const d=new Date(now),period=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1);
 try{
 const row=await db.prepare("SELECT net_revenue_cents, free_cash_cents, committed_cents, spent_cents, observed_at FROM hive_finance_monthly WHERE period_start=? AND verified=1 AND observed_at BETWEEN ? AND ? ORDER BY observed_at DESC LIMIT 1").bind(period,now-300000,now).first();
 const control=await db.prepare("SELECT stopped FROM hive_operational_control WHERE id=1").first();
 if(!row||![0,1].includes(control?.stopped))return undefined;
 const ledger={netRevenueCents:row.net_revenue_cents,freeCashCents:row.free_cash_cents,committedCents:row.committed_cents,spentCents:row.spent_cents,observedAt:row.observed_at,verified:true,stopped:control.stopped!==0};
 if(![ledger.netRevenueCents,ledger.freeCashCents,ledger.committedCents,ledger.spentCents,ledger.observedAt].every(v=>Number.isSafeInteger(v)&&v>=0))return undefined;
 return ledger;
 }catch{return undefined;}
}

export async function readFinanceHistory(db,now){
 if(!db||!Number.isSafeInteger(now))return [];
 try{
 const result=await db.prepare("SELECT period_start, observed_at, net_revenue_cents, spent_cents FROM hive_finance_monthly AS m WHERE verified=1 AND observed_at<=? AND observed_at=(SELECT MAX(n.observed_at) FROM hive_finance_monthly n WHERE n.period_start=m.period_start AND n.verified=1 AND n.observed_at<=?) ORDER BY period_start DESC LIMIT 12").bind(now,now).all();
 return (result.results||[]).filter(r=>[r.period_start,r.observed_at,r.net_revenue_cents,r.spent_cents].every(v=>Number.isSafeInteger(v)&&v>=0)).reverse();
 }catch{return [];}
}
