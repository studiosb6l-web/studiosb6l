// Cloudflare Worker staging-only webhook endpoint.
// Bindings: STRIPE_WEBHOOK_SECRET, CONTRACTS_DB (D1), CONTRACTS_ENABLED='staging'.
// Requires migration to be applied manually and payment metadata to be checked.
// Does NOT issue contracts or initiate transfers.
import {verifyStripeSignature} from './stripe-webhook-verify.js';
export async function handleContractStripeWebhook(request,env){
 if(request.method!=='POST') return new Response('Method not allowed',{status:405});
 if(env.CONTRACTS_ENABLED!=='staging'||!env.STRIPE_WEBHOOK_SECRET||!env.CONTRACTS_DB)
   return new Response('Disabled',{status:503});
 const raw=await request.text();
 if(raw.length>1000000)return new Response('Payload too large',{status:413});
 if(!await verifyStripeSignature(raw,request.headers.get('stripe-signature')||'',env.STRIPE_WEBHOOK_SECRET))
   return new Response('Invalid signature',{status:400});
 let event;try{event=JSON.parse(raw)}catch{return new Response('Invalid JSON',{status:400})}
 if(!event.id||!event.type||!event.data?.object)return new Response('Invalid event',{status:400});
 // Durable event ID deduplication must be added before production.
 // Payment object verification against a server-owned contract and Stripe API
 // must be completed before any contract state transition.
 return Response.json({received:true,processed:false,eventType:event.type});
}
