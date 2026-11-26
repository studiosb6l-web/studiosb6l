// Internal reconciliation; no provider calls unless explicitly enabled.
export async function reconcileExpiredTransmissions({store,provider,enabled=false,now=Date.now()}){
 if(enabled!==true||!store?.listExpired||!store?.confirmClosed||!provider?.closeRoom)return {closed:0,pending:0,enabled:false};
 const rows=await store.listExpired(now,20);
 let closed=0,pending=0;
 for(const row of rows.slice(0,20)){
  if(!row.id||!row.roomId||!Number.isFinite(row.expiresAt)||row.expiresAt>now)continue;
  try{
   const result=await provider.closeRoom(row.roomId);
   if(result?.closed!==true){pending++;continue;}
   await store.confirmClosed(row.id,now);
   closed++;
  }catch{pending++;}
 }
 return {closed,pending,enabled:true};
}
