import {emailBudget,emailConfigured} from './registration-email.mjs';
export async function supportEmail(env,{to,replyTo,ticketId,kind,subject,message},transport=globalThis.fetch){
 if(env.PREVIEW_ISOLATED==='true'||env.STOP_SERVICE==='true'||!emailConfigured(env)||env.REGISTRATION_EMAIL_PROVIDER!=='brevo'||!env.BREVO_API_KEY)return false;
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)||! /^[a-f0-9-]{36}$/.test(ticketId))return false;
 try{
  const day=new Date().toISOString().slice(0,10);
  const result=await env.DB.prepare('INSERT INTO registration_email_budget(day,used) VALUES(?,1) ON CONFLICT(day) DO UPDATE SET used=used+1 WHERE registration_email_budget.used<?').bind(day,emailBudget(env)).run();
  if(Number(result?.meta?.changes)!==1)return false;
  const body={sender:{email:env.REGISTRATION_FROM_EMAIL,name:'STUDIOSB6L · Suporte'},to:[{email:to}],subject:'Suporte STUDIOSB6L · '+ticketId,textContent:(kind==='reply'?'Recebeste uma resposta do suporte.':'Recebeste uma nova mensagem de suporte.')+'\nAssunto: '+String(subject||'').slice(0,120)+'\nMensagem: '+String(message||'').slice(0,3000)+'\nPedido: '+ticketId+'\nConsulta a conversa privada: https://studiosb6l-artists-api.studiosb6l.workers.dev/ajuda/\nAs respostas por email ficam no email; para manter o histórico na plataforma, usa o centro de ajuda.\nNunca envies palavras-passe, dados de cartão ou códigos de acesso.'};
  if(replyTo&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo))body.replyTo={email:replyTo};
  return (await transport('https://api.brevo.com/v3/smtp/email',{method:'POST',redirect:'manual',signal:AbortSignal.timeout(10000),headers:{'api-key':env.BREVO_API_KEY.trim(),'Content-Type':'application/json'},body:JSON.stringify(body)})).status===201;
 }catch{return false;}
}
