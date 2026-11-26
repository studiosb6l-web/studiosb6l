// Worker-side only. Persist digest, never raw token. Redemption must be atomic.
export const INVITE_TTL_MS=7*24*60*60*1000;
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
export async function digestInvite(token){
 if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))throw new TypeError('Invalid token');
 return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))));
}
export async function newInvite(now=Date.now()){
 if(!Number.isSafeInteger(now)||now<0)throw new TypeError('Invalid timestamp');
 const token=hex(crypto.getRandomValues(new Uint8Array(32)));
 return {token,tokenHash:await digestInvite(token),createdAt:now,expiresAt:now+INVITE_TTL_MS};
}
export function normalizeInviteEmail(email){
 if(typeof email!=='string')throw new TypeError('Invalid email');
 const value=email.trim().toLowerCase();
 if(value.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))throw new TypeError('Invalid email');
 return value;
}
