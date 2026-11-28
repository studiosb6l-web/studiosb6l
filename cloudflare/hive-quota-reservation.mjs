// Atomic D1 reservation for a pre-provisioned, verified quota window.
// No automatic creation/reset of windows; STOP and freshness checked in the same statement.
export async function reserveHiveQuota(db,{service,windowId,units,now}={}){
 if(!db||typeof service!=='string'||!service||typeof windowId!=='string'||!windowId||!Number.isSafeInteger(units)||units<=0||!Number.isSafeInteger(now)||now<0)return false;
 try{
 const result=await db.prepare("UPDATE hive_quota_windows SET reserved=reserved+? WHERE service=? AND window_id=? AND verified=1 AND stopped=0 AND observed_at<=? AND observed_at>=? AND expires_at>? AND used+reserved+?<=ceiling AND EXISTS (SELECT 1 FROM hive_operational_control WHERE id=1 AND stopped=0)").bind(units,service,windowId,now,now-300000,now,units).run();
 return result?.meta?.changes===1;
 }catch{return false;}
}
