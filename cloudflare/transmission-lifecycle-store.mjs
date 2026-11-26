// Requires the transmission_rooms migration before activation.
export function transmissionLifecycleStore(db){
 if(!db?.prepare)throw new TypeError('Database unavailable');
 return {
 async listExpired(now,limit=20){
 if(!Number.isSafeInteger(now)||!Number.isInteger(limit)||limit<1||limit>20)throw new TypeError('Invalid bounds');
 const result=await db.prepare("SELECT id,room_id AS roomId,expires_at AS expiresAt FROM transmission_rooms WHERE closed_at IS NULL AND expires_at<=? ORDER BY expires_at,id LIMIT ?").bind(now,limit).all();
 return result.results||[];
 },
 async confirmClosed(id,now){
 if(typeof id!=='string'||!Number.isSafeInteger(now))throw new TypeError('Invalid closure');
 await db.prepare("UPDATE transmission_rooms SET closed_at=? WHERE id=? AND closed_at IS NULL AND expires_at<=?").bind(now,id,now).run();
 }
 };
}
