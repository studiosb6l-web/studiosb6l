// Minimal secure Stripe webhook verification helper for Cloudflare Workers.
// Must be called on raw request bytes, before parsing JSON.
// Requires STRIPE_WEBHOOK_SECRET and WebCrypto; no external dependencies.
function bytesToHex(bytes){return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
function equalHex(a,b){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
export async function verifyStripeSignature(rawBody,header,secret,nowSeconds=Math.floor(Date.now()/1000)){
 if(typeof rawBody!=='string'||typeof header!=='string'||typeof secret!=='string'||!secret)return false;
 const parts=header.split(',').map(x=>x.trim().split('='));
 const timestamp=parts.find(([k])=>k==='t')?.[1];
 const signatures=parts.filter(([k])=>k==='v1').map(([,v])=>v);
 if(!/^\d+$/.test(timestamp||'')||signatures.length===0)return false;
 const ts=Number(timestamp);
 if(!Number.isSafeInteger(ts)||Math.abs(nowSeconds-ts)>300)return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const mac=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(timestamp+'.'+rawBody));
 const expected=bytesToHex(new Uint8Array(mac));
 return signatures.some(sig=>equalHex(expected,sig));
}
