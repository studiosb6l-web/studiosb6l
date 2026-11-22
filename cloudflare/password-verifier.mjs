// STUDIOSB6L password verifier for trusted backend login only.
// PBKDF2 is supported by Cloudflare Web Crypto. Prefer Argon2id in a vetted
// auth provider where available. Never log passwords or stored verifiers.
const ITERATIONS=310000, HASH_BYTES=32, SALT_BYTES=16;
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const fromHex=s=>new Uint8Array(s.match(/../g).map(v=>parseInt(v,16)));
async function derive(password,salt){
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:ITERATIONS,hash:'SHA-256'},key,HASH_BYTES*8));
}
function validPassword(p){return typeof p==='string'&&p.length>=12&&p.length<=128&&new TextEncoder().encode(p).length<=512}
export async function hashPassword(password){
  if(!validPassword(password))throw Error('Password does not meet requirements');
  const salt=crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const digest=await derive(password,salt);
  return `pbkdf2-sha256$${ITERATIONS}$${hex(salt)}$${hex(digest)}`;
}
export async function verifyPassword(password,stored){
  if(!validPassword(password)||typeof stored!=='string')return false;
  const m=/^pbkdf2-sha256\$(\d+)\$([0-9a-f]{32})\$([0-9a-f]{64})$/.exec(stored);
  if(!m||Number(m[1])!==ITERATIONS)return false;
  const expected=fromHex(m[3]),actual=await derive(password,fromHex(m[2]));
  let difference=0;for(let i=0;i<expected.length;i++)difference|=expected[i]^actual[i];
  return difference===0;
}
// Login endpoints must also enforce throttling, MFA, generic error messages,
// verified user state, session rotation and breach-password checks.
