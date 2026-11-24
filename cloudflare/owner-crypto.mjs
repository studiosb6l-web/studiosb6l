// RFC 6238 SHA-1 TOTP (6 digits, 30 seconds), tested against RFC vectors.
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function encodeBase32(bytes){let bits=0,value=0,out='';for(const b of bytes){value=(value<<8)|b;bits+=8;while(bits>=5){out+=alphabet[(value>>>(bits-5))&31];bits-=5;}}if(bits)out+=alphabet[(value<<(5-bits))&31];return out;}
function decodeBase32(s){if(typeof s!=='string'||! /^[A-Z2-7]{32}$/.test(s))throw Error('Invalid seed');let bits=0,value=0;const out=[];for(const c of s){value=(value<<5)|alphabet.indexOf(c);bits+=5;if(bits>=8){out.push((value>>>(bits-8))&255);bits-=8;}}return new Uint8Array(out);}
export const newTotpSecret=()=>encodeBase32(crypto.getRandomValues(new Uint8Array(20)));
export async function totp(secret,counter,digits=6){
 if(!Number.isSafeInteger(counter)||counter<0||![6,8].includes(digits))throw Error('Invalid counter');
 const key=await crypto.subtle.importKey('raw',decodeBase32(secret),{name:'HMAC',hash:'SHA-1'},false,['sign']);
 const input=new Uint8Array(8);new DataView(input.buffer).setBigUint64(0,BigInt(counter));
 const h=new Uint8Array(await crypto.subtle.sign('HMAC',key,input)),i=h[19]&15;
 const n=((h[i]&127)<<24)|(h[i+1]<<16)|(h[i+2]<<8)|h[i+3];return String(n%10**digits).padStart(digits,'0');
}
export async function matchTotp(secret,code,now=Date.now(),last=-1){
 if(typeof code!=='string'||!/^\d{6}$/.test(code))return null;
 const current=Math.floor(now/30000);let match=null;
 for(const step of [current-1,current,current+1]){if(step<0)continue;const expected=await totp(secret,step);let diff=0;for(let i=0;i<6;i++)diff|=expected.charCodeAt(i)^code.charCodeAt(i);if(diff===0&&step>last)match=step;}
 return match;
}
const text=new TextEncoder();
async function aesKey(env){
 if(typeof env.OWNER_MFA_ENCRYPTION_KEY!=='string'||env.OWNER_MFA_ENCRYPTION_KEY.length<43)throw Error('MFA encryption unavailable');
 const material=await crypto.subtle.importKey('raw',text.encode(env.OWNER_MFA_ENCRYPTION_KEY),'HKDF',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:text.encode('STUDIOSB6L owner MFA v1'),info:text.encode('AES-GCM TOTP seed')},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
const hex=bytes=>Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
const unhex=s=>new Uint8Array(s.match(/../g).map(x=>parseInt(x,16)));
export async function encryptSeed(env,seed,accountId){
 decodeBase32(seed);const iv=crypto.getRandomValues(new Uint8Array(12));
 const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:text.encode('owner:'+accountId)},await aesKey(env),text.encode(seed));
 return hex(iv)+'.'+hex(new Uint8Array(ciphertext));
}
export async function decryptSeed(env,value,accountId){
 if(typeof value!=='string'||! /^[a-f0-9]{24}\.[a-f0-9]{96}$/.test(value))throw Error('Invalid ciphertext');const [iv,c]=value.split('.');
 const seed=new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unhex(iv),additionalData:text.encode('owner:'+accountId)},await aesKey(env),unhex(c)));decodeBase32(seed);return seed;
}
export const hashRecovery=async(code)=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',text.encode('owner-recovery-v1:'+code))));
export const newRecoveryCodes=()=>Array.from({length:8},()=>hex(crypto.getRandomValues(new Uint8Array(16))));
