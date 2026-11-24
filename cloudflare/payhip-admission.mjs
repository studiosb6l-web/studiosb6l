// Payhip is the checkout provider; PayPal is configured within the store.
// Contract: https://help.payhip.com/article/115-webhooks
// Payhip's signature is SHA256(API key), a reusable bearer credential, NOT
// a per-message HMAC. Never expose it, request bodies or secrets in logs/clients.
const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function payhipCheckout(env){
 try{const u=new URL(env.PAYHIP_ADMISSION_CHECKOUT_URL);return u.protocol==='https:'&&u.hostname==='payhip.com'&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==='/b/'+env.PAYHIP_ADMISSION_PRODUCT_KEY?u:null;}catch{return null;}
}
export function payhipConfigured(env){return env?.PAYHIP_ACTIVATION_VERIFIED==='true'&&typeof env.PAYHIP_WEBHOOK_API_KEY==='string'&&env.PAYHIP_WEBHOOK_API_KEY.length>=32&&/^[A-Za-z0-9]+$/.test(env.PAYHIP_ADMISSION_PRODUCT_KEY||'')&&!!payhipCheckout(env);}
async function authentic(signature,key){
 if(typeof signature!=='string'||!/^\w{64}$/.test(signature))return false;
 const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key)));
 const expected=Array.from(digest,b=>b.toString(16).padStart(2,'0')).join('');let diff=0;
 for(let i=0;i<64;i++)diff|=signature.charCodeAt(i)^expected.charCodeAt(i);return diff===0;
}
export async function payhipWebhook(request,env={}){
 if(request.method!=='POST')return reply(405,{error:'Method not allowed'});
 if(!env.DB||!payhipConfigured(env))return reply(503,{error:'Payments unavailable'});
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return reply(415,{error:'JSON required'});
 let event;
 try{
  const reader=request.body?.getReader();if(!reader)return reply(400,{error:'Invalid request'});
  const chunks=[];let n=0;for(;;){const {value,done}=await reader.read();if(done)break;n+=value.length;if(n>65536){await reader.cancel();return reply(413,{error:'Too large'});}chunks.push(value);}
  const bytes=new Uint8Array(n);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}event=JSON.parse(new TextDecoder().decode(bytes));
 }catch{return reply(400,{error:'Invalid request'});}
 if(!event||!await authentic(event.signature,env.PAYHIP_WEBHOOK_API_KEY))return reply(400,{error:'Invalid signature'});
 if(!['paid','refunded'].includes(event.type))return reply(200,{received:true});
 if(typeof event.id!=='string'||! /^[A-Za-z0-9_-]{1,128}$/.test(event.id))return reply(400,{error:'Invalid transaction'});
 const item=event.items?.[0];
 if(!Array.isArray(event.items)||event.items.length!==1||item?.product_key!==env.PAYHIP_ADMISSION_PRODUCT_KEY||String(item.quantity)!=='1'||event.currency!=='EUR'||event.price!==299||event.is_gift===true)return reply(200,{received:true});
 const db=env.DB,now=Date.now();
 try{
  if(event.type==='refunded'){
   if(!Number.isSafeInteger(event.amount_refunded)||event.amount_refunded<299)return reply(200,{received:true});
   // Record refunds even when they arrive before the paid notification.
   await db.batch([
    db.prepare('INSERT OR IGNORE INTO payhip_admission_refunds VALUES(?,?)').bind(event.id,now),
    db.prepare('UPDATE payhip_admission_payments SET revoked_at=COALESCE(revoked_at,?) WHERE transaction_id=?').bind(now,event.id),
    db.prepare('UPDATE account_onboarding SET revoked_at=COALESCE(revoked_at,?) WHERE account_id IN (SELECT account_id FROM payhip_admission_payments WHERE transaction_id=?)').bind(now,event.id),
    db.prepare("UPDATE accounts SET verified=0 WHERE role!='owner' AND id IN (SELECT account_id FROM payhip_admission_payments WHERE transaction_id=?)").bind(event.id),
    db.prepare("DELETE FROM sessions WHERE user_id IN (SELECT a.id FROM accounts a JOIN payhip_admission_payments p ON p.account_id=a.id WHERE p.transaction_id=? AND a.role!='owner')").bind(event.id)
   ]);return reply(200,{received:true});
  }
  if(env.STOP_SERVICE==='true')return reply(503,{error:'Service suspended'});
  const email=typeof event.email==='string'?event.email.trim().toLowerCase():'';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return reply(400,{error:'Invalid buyer'});
  // Only a pre-existing, email-verified ordinary account may receive admission.
  // One transaction and one account can each be bound only once, atomically.
  await db.batch([
   db.prepare("INSERT OR IGNORE INTO payhip_admission_payments(transaction_id,account_id,paid_at) SELECT ?,a.id,? FROM accounts a JOIN account_onboarding o ON o.account_id=a.id WHERE a.email=? AND a.disabled=0 AND a.role IN ('artist','producer','promoter','venue','company','student') AND o.email_verified_at IS NOT NULL AND o.revoked_at IS NULL AND NOT EXISTS(SELECT 1 FROM payhip_admission_refunds WHERE transaction_id=?)").bind(event.id,now,email,event.id),
   db.prepare('UPDATE account_onboarding SET paid_at=COALESCE(paid_at,?) WHERE account_id IN (SELECT account_id FROM payhip_admission_payments WHERE transaction_id=? AND revoked_at IS NULL) AND email_verified_at IS NOT NULL AND revoked_at IS NULL').bind(now,event.id),
   db.prepare("UPDATE accounts SET verified=1 WHERE disabled=0 AND role IN ('artist','producer','promoter','venue','company','student') AND id IN (SELECT o.account_id FROM account_onboarding o JOIN payhip_admission_payments p ON p.account_id=o.account_id WHERE p.transaction_id=? AND p.revoked_at IS NULL AND o.revoked_at IS NULL AND o.email_verified_at IS NOT NULL AND o.paid_at IS NOT NULL)").bind(event.id),
   db.prepare('UPDATE account_onboarding SET activated_at=COALESCE(activated_at,?) WHERE revoked_at IS NULL AND account_id IN (SELECT p.account_id FROM payhip_admission_payments p JOIN accounts a ON a.id=p.account_id WHERE p.transaction_id=? AND p.revoked_at IS NULL AND a.verified=1 AND a.disabled=0)').bind(now,event.id)
  ]);return reply(200,{received:true});
 }catch{return reply(503,{error:'Payment processing unavailable'});}
}
