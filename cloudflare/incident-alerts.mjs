import {emailBudget,emailConfigured} from './registration-email.mjs';
const reasons={
 'payment-not-activated':'Pagamento recebido, mas a conta não ficou ativa. Verificar a correspondência do email, o estado da conta e os registos Payhip.',
 'payment-review':'Notificação Payhip autenticada para o acesso com valor, moeda ou artigos inesperados. Rever o pagamento.',
 'service-error':'Falha técnica no acesso, inscrição, confirmação de email ou processamento de pagamento.'
};
// Fixed, private destination. No buyer email, payment payload, signature or token.
// Namespaced counters reuse the existing quota table; no schema change required.
export async function notifyIncident(env,code,transport=globalThis.fetch,now=Date.now()){
 if(env.PREVIEW_ISOLATED==='true'||env.STOP_SERVICE==='true'||!reasons[code]||!emailConfigured(env)||!env.DB||env.INCIDENT_ALERT_TO!=='studiosb6l@gmail.com')return false;
 try{
  const day=new Date(now).toISOString().slice(0,10),hour=new Date(now).toISOString().slice(0,13);
  const counter=(key,max)=>env.DB.prepare('INSERT INTO registration_email_budget(day,used) VALUES(?,1) ON CONFLICT(day) DO UPDATE SET used=used+1 WHERE registration_email_budget.used<?').bind(key,max);
  // All attempts count conservatively, even if another limit or delivery fails.
  const reservations=await env.DB.batch([counter(day,emailBudget(env)),counter('incident-day:'+day,3),counter('incident-hour:'+hour,1)]);
  if(!reservations.every(r=>Number(r?.meta?.changes)===1))return false;
  if(env.REGISTRATION_EMAIL_PROVIDER!=='brevo'||!env.BREVO_API_KEY)return false;
  const r=await transport('https://api.brevo.com/v3/smtp/email',{method:'POST',redirect:'manual',signal:AbortSignal.timeout(10000),headers:{'api-key':env.BREVO_API_KEY.trim(),'Content-Type':'application/json'},body:JSON.stringify({sender:{email:env.REGISTRATION_FROM_EMAIL,name:'STUDIOSB6L'},to:[{email:env.INCIDENT_ALERT_TO}],subject:'Aviso técnico · STUDIOSB6L',textContent:reasons[code]+'\nCódigo: '+code+'\nHora UTC: '+new Date(now).toISOString()+'\nConsultar os registos privados da plataforma e Payhip. Não pedir ao comprador que pague novamente.\nAvisos limitados a um por hora e três por dia, dentro do orçamento diário de email.'})});
  return r.status===201;
 }catch{return false;}
}
export function queueIncident(env,ctx,code){
 const pending=notifyIncident(env,code);
 if(typeof ctx?.waitUntil==='function')ctx.waitUntil(pending);
 return pending;
}
