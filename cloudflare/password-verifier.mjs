// Standard scrypt via the runtime's native crypto implementation.
// OWASP's memory/CPU tradeoff: N=2^15, r=8, p=3, about 32 MiB working memory.
// Old verifiers are not rewritten or weakened. No plaintext credentials are stored.
import {scrypt,timingSafeEqual} from 'node:crypto';
const N=32768,R=8,P=3,HASH_BYTES=32,SALT_BYTES=16,MAX_MEMORY=64*1024*1024;
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const fromHex=s=>new Uint8Array(s.match(/../g).map(v=>parseInt(v,16)));
let deriving=false;
async function derive(password,salt){
  // Bound per-isolate memory: concurrent derivations fail closed instead of
  // allowing several 32-MiB working sets to exhaust Worker memory.
  if(deriving)throw Error('Password verifier busy');
  deriving=true;
  try{return await new Promise((resolve,reject)=>scrypt(password,salt,HASH_BYTES,{N,r:R,p:P,maxmem:MAX_MEMORY},(error,key)=>error?reject(error):resolve(new Uint8Array(key))));}
  finally{deriving=false;}
}
function validPassword(p){return typeof p==='string'&&p.length>=12&&p.length<=128&&new TextEncoder().encode(p).length<=512;}
export async function hashPassword(password){
  if(!validPassword(password))throw Error('Password does not meet requirements');
  const salt=crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  return `scrypt$${N}$${R}$${P}$${hex(salt)}$${hex(await derive(password,salt))}`;
}
export async function verifyPassword(password,stored){
  if(!validPassword(password)||typeof stored!=='string')return false;
  const current=/^scrypt\$32768\$8\$3\$([0-9a-f]{32})\$([0-9a-f]{64})$/.exec(stored);
  if(current)return timingSafeEqual(fromHex(current[2]),await derive(password,fromHex(current[1])));
  const legacy=/^pbkdf2-sha256\$310000\$([0-9a-f]{32})\$([0-9a-f]{64})$/.exec(stored);
  if(!legacy)return false;
  // Keep the original work factor for legacy hashes. Unsupported runtimes
  // reject them; no truncated-iteration fallback can create a false match.
  try{
    const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
    const actual=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:fromHex(legacy[1]),iterations:310000,hash:'SHA-256'},key,HASH_BYTES*8));
    return timingSafeEqual(fromHex(legacy[2]),actual);
  }catch{return false;}
}
export async function passwordRuntimeProbe(){
  // Independent Python hashlib/RFC scrypt test vector, containing no user data.
  const expected='bbdb34e0c0d20b52858806601bcb6cff0c8778a67e805def89cf31f1b10809e5';
  return timingSafeEqual(fromHex(expected),await derive('STUDIOSB6L public runtime canary',new Uint8Array(16)));
}
