import {canHost,canJoin,canReserveQuota,LIMITS} from './ambassador-session-policy.mjs';
// Internal boundary only. The store must implement an atomic transaction and
// obtain current membership, counters and provider metrics from trusted sources.
export async function reserveTransmission({store,accountId,sessionId,action,now=Date.now()}){
 if(!store||typeof store.atomicReserve!=='function'||!accountId||!sessionId||!['host','join'].includes(action))return {allowed:false};
 try{
  return await store.atomicReserve({accountId,sessionId,action,now},state=>{
   if(!state||state.stop!==false||state.metricsFresh!==true||!canReserveQuota(state.metrics))return null;
   if(action==='host'){
    if(!canHost(state.membership,now)||state.activeElsewhere!==false||state.hostBudgetAvailable!==true)return null;
    return {maxParticipants:LIMITS.participants,expiresAt:now+LIMITS.durationMs,warningAt:now+LIMITS.warningMs};
   }
   if(!canJoin(state,now))return null;
   return {expiresAt:state.startedAt+LIMITS.durationMs};
  });
 }catch{return {allowed:false};}
}
