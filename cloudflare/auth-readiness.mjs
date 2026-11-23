import {passwordRuntimeProbe} from './password-verifier.mjs';
// Runtime readiness uses a public, non-user canary and never changes credentials.
let cryptoCheck;
export function passwordRuntimeReady(){
  if(!cryptoCheck)cryptoCheck=passwordRuntimeProbe().catch(()=>false);
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
