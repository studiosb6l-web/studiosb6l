import {trustedAuthOrigin} from './auth-origins.mjs';
// STUDIOSB6L — cryptographically secure opaque session token helper.
// Backend only. Do not expose token hashes or log plaintext tokens.
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
export async function createSessionToken(){
  const bytes=new Uint8Array(32);
  crypto.getRandomValues(bytes);
  // 32 bytes -> 43 URL-safe base64 characters, without padding.
  let binary='';for(const b of bytes)binary+=String.fromCharCode(b);
  const token=btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  if(token.length!==43||![...token].every(c=>alphabet.includes(c)))throw Error('Invalid token generation');
  return {token,hash:await hashSessionToken(token)};
}
export async function hashSessionToken(token){
  if(typeof token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(token))throw Error('Invalid session token');
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
}
// Login service must enforce rate limits, password verification, MFA, rotation,
// secure delivery, short expiry, account-level revocation and D1 transaction safety.

export const SESSION_COOKIE='__Host-b6l_session';
export function sessionCookie(token,maxAge=1800){
  if(!/^[A-Za-z0-9_-]{43}$/.test(token))throw Error('Invalid session token');
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
export const clearSessionCookie=()=>`${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
export function requestSessionToken(request){
  const authorization=request.headers.get('Authorization');
  // Retain existing server/API bearer clients; malformed headers never fall back.
  if(authorization!==null)return /^Bearer ([A-Za-z0-9_-]{43})$/.exec(authorization)?.[1]||null;
  if(!['GET','HEAD','OPTIONS'].includes(request.method)&&!trustedAuthOrigin(request.headers.get('Origin')))return null;
  const values=(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).filter(x=>x.startsWith(SESSION_COOKIE+'='));
  if(values.length!==1)return null;
  const token=values[0].slice(SESSION_COOKIE.length+1);
  return /^[A-Za-z0-9_-]{43}$/.test(token)?token:null;
}
