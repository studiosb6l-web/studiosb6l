// Admission is a one-time EUR 2.99 payment, independent of music downloads.
// No browser success page, email field or client flag can activate an account.
import Stripe from 'stripe';
const stripe=new Stripe(undefined,{authenticator:async()=>{throw Error('Stripe API access is disabled in the webhook verifier');}});
const cryptoProvider=Stripe.createSubtleCryptoProvider();
const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const sha256=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
export async function admissionWebhook(request,env){
  if(request.method!=='POST')return reply(405,{error:'Method not allowed'});
  if(!env?.DB||!env.STRIPE_ADMISSION_WEBHOOK_SECRET||!env.STRIPE_ADMISSION_PAYMENT_LINK_ID)return reply(503,{error:'Payment integration unavailable'});
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return reply(415,{error:'JSON required'});
  // A bounded stream protects memory even if Content-Length is absent or forged.
  const reader=request.body?.getReader();if(!reader)return reply(400,{error:'Invalid request'});
  const chunks=[];let size=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>65536){await reader.cancel();return reply(413,{error:'Too large'});}chunks.push(value);}}catch{return reply(400,{error:'Invalid request'});}
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.byteLength;}
  const body=new TextDecoder().decode(bytes);
  let event;
  try{event=await stripe.webhooks.constructEventAsync(body,request.headers.get('Stripe-Signature')||'',env.STRIPE_ADMISSION_WEBHOOK_SECRET,300,cryptoProvider);}catch{return reply(400,{error:'Invalid signature'});}
  // Reject test-mode events at this production endpoint.
  if(typeof event.id!=='string'||!/^evt_/.test(event.id))return reply(400,{error:'Invalid event'});
  if(event.livemode!==true)return reply(400,{error:'Invalid payment mode'});
  const risk=event.data?.object;
  const refunded=event.type==='charge.refunded'&&risk?.object==='charge'&&risk.amount_refunded>=risk.amount&&risk.amount>0;
  const disputed=(event.type==='charge.dispute.created'||event.type==='charge.dispute.closed'&&risk?.status==='lost')&&risk?.object==='dispute';
  if(refunded||disputed){
    if(typeof risk.payment_intent!=='string'||!/^pi_/.test(risk.payment_intent))return reply(200,{received:true});
    try{
      const now=Date.now(),db=env.DB;
      await db.batch([
        db.prepare('INSERT OR IGNORE INTO admission_payment_events(event_id,session_id,payment_intent_id,event_type,received_at) VALUES(?,NULL,?,?,?)').bind(event.id,risk.payment_intent,event.type,now),
        db.prepare('INSERT OR IGNORE INTO admission_payment_blocks(payment_intent_id,blocked_at) VALUES(?,?)').bind(risk.payment_intent,now),
        db.prepare('UPDATE account_onboarding SET revoked_at=COALESCE(revoked_at,?) WHERE stripe_payment_intent_id=?').bind(now,risk.payment_intent),
        db.prepare("UPDATE accounts SET verified=0 WHERE role!='owner' AND id IN (SELECT account_id FROM account_onboarding WHERE stripe_payment_intent_id=? AND revoked_at IS NOT NULL)").bind(risk.payment_intent),
        db.prepare("DELETE FROM sessions WHERE user_id IN (SELECT a.id FROM accounts a JOIN account_onboarding o ON a.id=o.account_id WHERE o.stripe_payment_intent_id=? AND o.revoked_at IS NOT NULL AND a.role!='owner')").bind(risk.payment_intent)
      ]);
      return reply(200,{received:true});
    }catch{return reply(503,{error:'Payment processing unavailable'});}
  }
  if(!['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type))return reply(200,{received:true});
  const session=event.data?.object;
  // Payment Links fixes the product, quantity and price. All fields below are
  // taken from Stripe's signed event, never the browser or return URL.
  if(session?.object!=='checkout.session'||session.mode!=='payment'||session.status!=='complete'||session.payment_status!=='paid'||session.currency!=='eur'||session.amount_total!==299||session.payment_link!==env.STRIPE_ADMISSION_PAYMENT_LINK_ID)return reply(200,{received:true});
  if(typeof session.id!=='string'||!/^cs_/.test(session.id)||typeof session.payment_intent!=='string'||!/^pi_/.test(session.payment_intent)||typeof event.id!=='string'||!/^evt_/.test(event.id)||typeof session.client_reference_id!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(session.client_reference_id))return reply(200,{received:true});
  const reference=await sha256(session.client_reference_id);
  const now=Date.now();
  try{
    // D1 batch is transactional. Replayed events and sessions are harmless;
    // payment cannot enable an unverified email or an administrative role.
    const db=env.DB;
    await db.batch([
      db.prepare('INSERT OR IGNORE INTO admission_payment_events(event_id,session_id,payment_intent_id,event_type,received_at) VALUES(?,?,?,?,?)').bind(event.id,session.id,session.payment_intent,event.type,now),
      db.prepare('UPDATE account_onboarding SET paid_at=COALESCE(paid_at,?),stripe_session_id=?,stripe_payment_intent_id=?,revoked_at=COALESCE(revoked_at,(SELECT blocked_at FROM admission_payment_blocks WHERE payment_intent_id=?)) WHERE checkout_reference_hash=? AND (stripe_session_id IS NULL OR stripe_session_id=?)').bind(now,session.id,session.payment_intent,session.payment_intent,reference,session.id),
      db.prepare("UPDATE accounts SET verified=1 WHERE disabled=0 AND role IN ('artist','producer','promoter','venue','company','student') AND id IN (SELECT account_id FROM account_onboarding WHERE checkout_reference_hash=? AND email_verified_at IS NOT NULL AND paid_at IS NOT NULL AND stripe_session_id=? AND revoked_at IS NULL)").bind(reference,session.id),
      db.prepare('UPDATE account_onboarding SET activated_at=COALESCE(activated_at,?) WHERE checkout_reference_hash=? AND stripe_session_id=? AND email_verified_at IS NOT NULL AND paid_at IS NOT NULL AND revoked_at IS NULL AND account_id IN (SELECT id FROM accounts WHERE verified=1 AND disabled=0)').bind(now,reference,session.id)
    ]);
    return reply(200,{received:true});
  }catch{return reply(503,{error:'Payment processing unavailable'});}
}
