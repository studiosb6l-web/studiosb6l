// Transactional email adapter. No account creation, paid plan or automatic refill.
// Brevo API contract: https://developers.brevo.com/reference/send-transac-email
export function emailBudget(env){
 const quota=Number(env?.EMAIL_FREE_DAILY_QUOTA),limit=Number(env?.EMAIL_DAILY_BUDGET);
 return env?.EMAIL_BUDGET_VERIFIED==='true'&&Number.isSafeInteger(quota)&&Number.isSafeInteger(limit)&&quota>0&&limit>0&&limit<=Math.floor(quota*0.7)?limit:0;
}
export function emailConfigured(env){
 return !!emailBudget(env)&&(typeof env?.EMAIL_SERVICE?.fetch==='function'||env?.REGISTRATION_EMAIL_PROVIDER==='brevo'&&typeof env.BREVO_API_KEY==='string'&&env.BREVO_API_KEY.length>10&&env.BREVO_SENDER_VERIFIED==='true'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.REGISTRATION_FROM_EMAIL||''));
}
export async function reserveEmail(env,id,now){
 const limit=emailBudget(env);if(!limit)return {allowed:false};
 const day=new Date(now).toISOString().slice(0,10),until=now+60000;
 const results=await env.DB.batch([
  env.DB.prepare('INSERT INTO account_email_send_locks(account_id,available_after) VALUES(?,?) ON CONFLICT(account_id) DO UPDATE SET available_after=excluded.available_after WHERE account_email_send_locks.available_after<=?').bind(id,until,now),
  env.DB.prepare('INSERT INTO registration_email_budget(day,used) VALUES(?,1) ON CONFLICT(day) DO UPDATE SET used=used+1 WHERE registration_email_budget.used<?').bind(day,limit)
 ]);
 // Count failed and throttled reservations conservatively; never refund quota
 // after an uncertain network response, which could otherwise allow overspend.
 return {allowed:results.every(r=>Number(r?.meta?.changes)===1),until};
}
export async function sendVerificationEmail(env,{to,verificationUrl},transport=fetch){
 if(!emailConfigured(env))return false;
 const url=new URL(verificationUrl);
 if(url.origin!=='https://www.studiosb6l.com'||url.pathname!=='/conta/'||!/^#verify=[A-Za-z0-9_-]{43}$/.test(url.hash))return false;
 if(typeof env.EMAIL_SERVICE?.fetch==='function'){
  const r=await env.EMAIL_SERVICE.fetch(new Request('https://email.internal/verification',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to,verificationUrl:url.href,expiresInMinutes:30})}));return r.ok;
 }
 const text='Confirma o teu email STUDIOSB6L:\n'+url.href+'\n\nEsta ligação expira em 30 minutos. A confirmação não efetua pagamentos nem inicia subscrições. Se não pediste esta conta, ignora esta mensagem.';
 // The URL and text contain only fixed content and a validated URL-safe token.
 let r;
 try{r=await transport('https://api.brevo.com/v3/smtp/email',{method:'POST',redirect:'error',signal:AbortSignal.timeout(10000),headers:{'api-key':env.BREVO_API_KEY.trim(),'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({sender:{email:env.REGISTRATION_FROM_EMAIL,name:'STUDIOSB6L'},to:[{email:to}],subject:'Confirma o teu email · STUDIOSB6L',textContent:text,htmlContent:'<p>Confirma o teu email STUDIOSB6L.</p><p><a href="'+url.href+'">Confirmar email</a></p><p>Ligação válida durante 30 minutos. Não efetua pagamentos nem inicia subscrições.</p>'})});}catch(error){const message=String(error?.message||'');const reason=/header/i.test(message)?'invalid-header':/timeout|abort/i.test(message)?'timeout':'transport';throw new Error('Email provider '+reason);}
 if(r.status!==201)return false;
 const data=await r.json().catch(()=>null);return typeof data?.messageId==='string'&&!!data.messageId;
}
