// STUDIOSB6L one-time membership Checkout, isolated from existing artist registration.
// Requires Stripe secret, Stripe webhook secret, D1 DB binding and deployed routes.
// Never trust checkout success redirect as proof of payment.
const ORIGIN='https://www.studiosb6l.com';
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':ORIGIN,'vary':'Origin','cache-control':'no-store'}});
const encoder=new TextEncoder();
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
async function verifyStripeSignature(payload,signature,secret){
 const parts=Object.fromEntries((signature||'').split(',').map(p=>p.split('=',2)));
 const timestamp=Number(parts.t);
 if(!Number.isSafeInteger(timestamp)||Math.abs(Date.now()/1000-timestamp)>300||!parts.v1)return false;
 const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signed=hex(await crypto.subtle.sign('HMAC',key,encoder.encode(parts.t+'.'+payload)));
 const a=encoder.encode(signed),b=encoder.encode(parts.v1);
 if(a.length!==b.length)return false;
 let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;
}
async function stripeForm(env,values){
 const r=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{authorization:'Bearer '+env.STRIPE_SECRET_KEY,'content-type':'application/x-www-form-urlencoded','Idempotency-Key':values.idempotencyKey},body:values.params.toString()});
 if(!r.ok)throw new Error('Stripe checkout failed '+r.status);
 return r.json();
}
export default {async fetch(request,env){
 const path=new URL(request.url).pathname;
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':ORIGIN,'access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'Content-Type','vary':'Origin'}});
 if(!env.DB||!env.STRIPE_SECRET_KEY||!env.STRIPE_WEBHOOK_SECRET)return json({error:'Membership payments not configured'},503);
 if(path==='/api/membership/checkout'&&request.method==='POST'){
  if(request.headers.get('origin')!==ORIGIN)return json({error:'Invalid origin'},403);
  if(Number(request.headers.get('content-length')||0)>4096)return json({error:'Payload too large'},413);
  let body;try{body=await request.json()}catch{return json({error:'Invalid JSON'},400)}
  const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
  if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)||email.length>200||body.acceptTerms!==true)return json({error:'Email and terms required'},422);
  // Account creation and identity verification MUST be added before production:
  // An email alone is not authenticated account identity; do not grant access from this endpoint.
  return json({error:'Authenticated membership identity not yet integrated; checkout disabled'},503);
 }
 if(path==='/api/membership/webhook'&&request.method==='POST'){
  const raw=await request.text();
  if(raw.length>200000)return json({error:'Payload too large'},413);
  if(!await verifyStripeSignature(raw,request.headers.get('stripe-signature'),env.STRIPE_WEBHOOK_SECRET))return json({error:'Invalid signature'},400);
  let event;try{event=JSON.parse(raw)}catch{return json({error:'Invalid event'},400)}
  if(event.type!=='checkout.session.completed')return json({received:true});
  const s=event.data?.object;
  if(s?.mode!=='payment'||s?.payment_status!=='paid'||s?.currency!=='eur'||s?.amount_total!==299||s?.metadata?.purpose!=='studiosb6l_membership')return json({received:true});
  // Membership must be bound to a server-authenticated user ID, not an untrusted email.
  // Refuse fulfillment until the identity+idempotency transaction is implemented.
  return json({error:'Membership fulfillment disabled pending authenticated identity mapping'},503);
 }
 return json({error:'Not found'},404);
}};
