// Runtime readiness uses a public, non-user canary and never changes credentials.
let cryptoCheck;
export function passwordRuntimeReady(){
  if(!cryptoCheck)cryptoCheck=(async()=>{
    try{
      const key=await crypto.subtle.importKey('raw',new TextEncoder().encode('STUDIOSB6L public runtime canary'),'PBKDF2',false,['deriveBits']);
      await crypto.subtle.deriveBits({name:'PBKDF2',salt:new Uint8Array(16),iterations:310000,hash:'SHA-256'},key,256);
      return true;
    }catch{return false;}
  })();
  return cryptoCheck;
}
export async function authReadiness(env){
  const rateLimitBound=typeof env?.AUTH_RATE_LIMIT?.limit==='function';
  const passwordRuntimeSupported=await passwordRuntimeReady();
  const enabled=env?.LOGIN_ENABLED==='true'&&!!env?.DB&&rateLimitBound&&passwordRuntimeSupported;
  return {enabled,rateLimitBound,passwordRuntimeSupported};
}
export async function checkAuthRate(request,env){
  if(typeof env?.AUTH_RATE_LIMIT?.limit!=='function')return 503;
  const ip=request.headers.get('CF-Connecting-IP');
  if(!ip)return 503;
  try{return (await env.AUTH_RATE_LIMIT.limit({key:'auth:'+ip})).success?null:429;}catch{return 503;}
}
