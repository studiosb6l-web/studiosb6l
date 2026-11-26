// Integer milliseconds avoid rounding each attendance interval independently.
export async function transmissionUsage(db,accountId,from,to,budgetMinutes){
 if(!db?.prepare||typeof accountId!=='string'||!accountId||![from,to,budgetMinutes].every(Number.isSafeInteger)||from<0||to<=from||budgetMinutes<0||budgetMinutes>1000000)throw new TypeError('Invalid usage bounds');
 const row=await db.prepare(`SELECT COALESCE(SUM(MAX(0, MIN(COALESCE(a.left_at,r.expires_at),COALESCE(r.closed_at,r.expires_at),r.expires_at,?) - MAX(a.joined_at,?))),0) AS used_ms FROM transmission_attendance a JOIN transmission_rooms r ON r.id=a.transmission_id WHERE a.account_id=? AND a.joined_at<? AND COALESCE(a.left_at,r.expires_at)>?`).bind(to,from,accountId,to,from).first();
 const usedMs=row?.used_ms;
 if(!Number.isSafeInteger(usedMs)||usedMs<0)throw new Error('Usage unavailable');
 const budgetMs=budgetMinutes*60000;
 return {usedMs,usedMinutes:Math.ceil(usedMs/60000),remainingMs:Math.max(0,budgetMs-usedMs),remainingMinutes:Math.floor(Math.max(0,budgetMs-usedMs)/60000)};
}
