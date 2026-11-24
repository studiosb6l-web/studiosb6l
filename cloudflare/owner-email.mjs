import {emailBudget,emailConfigured} from './registration-email.mjs';
export async function ownerEmail(env,{token,kind='activate'},transport=globalThis.fetch){
 if(env.PREVIEW_ISOLATED==='true'||env.STOP_SERVICE==='true'||env.OWNER_EMAIL!=='studiosb6l@gmail.com'||!emailConfigured(env)||env.REGISTRATION_EMAIL_PROVIDER!=='brevo'||!env.BREVO_API_KEY)return false;
 if(kind==='activate'&&!/^[A-Za-z0-9_-]{43}$/.test(token||''))return false;
 try{
  const day=new Date().toISOString().slice(0,10);
  const counter=(scope,limit)=>env.DB.prepare('INSERT INTO registration_email_budget(day,used) VALUES(?,1) ON CONFLICT(day) DO UPDATE SET used=used+1 WHERE registration_email_budget.used<?').bind(scope,limit);
  const r=await env.DB.batch([counter(day,emailBudget(env)),counter('owner-email:'+day,3)]);if(!r.every(x=>Number(x?.meta?.changes)===1))return false;
  const content=kind==='activate'?'Abre esta ligação para definir a palavra-passe e associar a aplicação autenticadora. Expira em 15 minutos e só pode ser usada uma vez.\nhttps://studiosb6l-artists-api.studiosb6l.workers.dev/administracao/#setup='+token+'\nNão partilhes esta ligação, os códigos ou a chave da aplicação.':'A autenticação de administrador da STUDIOSB6L foi ativada com palavra-passe e aplicação autenticadora. Guarda os códigos de recuperação num local privado. Se não foste tu, suspende o acesso e contacta o responsável técnico.';
  return (await transport('https://api.brevo.com/v3/smtp/email',{method:'POST',redirect:'manual',signal:AbortSignal.timeout(10000),headers:{'api-key':env.BREVO_API_KEY.trim(),'Content-Type':'application/json'},body:JSON.stringify({sender:{email:env.REGISTRATION_FROM_EMAIL,name:'STUDIOSB6L · Administração'},to:[{email:env.OWNER_EMAIL}],subject:kind==='activate'?'Ativar acesso de administrador · STUDIOSB6L':'Acesso de administrador ativado · STUDIOSB6L',textContent:content})})).status===201;
 }catch{return false;}
}
