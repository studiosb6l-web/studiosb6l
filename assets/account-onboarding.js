(()=>{'use strict';
const api='https://studiosb6l-artists-api.studiosb6l.workers.dev';
const byId=id=>document.getElementById(id);
let token=location.hash.startsWith('#verify=')?location.hash.slice(8):'';
if(token){history.replaceState(null,'',location.pathname+location.search);byId('verification-panel').hidden=false;}
async function call(path,payload){
 const r=await fetch(api+path,{method:payload?'POST':'GET',mode:'cors',credentials:'omit',cache:'no-store',headers:payload?{'Content-Type':'application/json'}:{},body:payload?JSON.stringify(payload):undefined});
 const d=await r.json();if(!r.ok||d.success!==true)throw Error('Não foi possível concluir. Tenta novamente mais tarde.');return d;
}
// A live readiness check controls the form; static publication never enables it.
call('/api/auth/status').then(d=>{byId('registration-panel').hidden=d.registrationEnabled!==true||!!token;}).catch(()=>{});
byId('registration-form').addEventListener('submit',async e=>{
 e.preventDefault();const button=e.target.querySelector('button'),status=byId('registration-status');button.disabled=true;status.textContent='A enviar confirmação…';
 try{const d=await call('/api/auth/register',{email:byId('register-email').value.trim(),password:byId('register-password').value,role:byId('register-role').value,acceptTerms:byId('register-consent').checked});status.textContent=d.message||'Consulta o teu email para continuar.';}
 catch(error){status.textContent=error.message;}
 finally{byId('register-password').value='';button.disabled=false;}
});
byId('verify-email').addEventListener('click',async e=>{
 const button=e.target,status=byId('verification-status');button.disabled=true;
 try{if(!/^[A-Za-z0-9_-]{43}$/.test(token))throw Error('Ligação inválida ou expirada.');const d=await call('/api/auth/verify-email',{token});const url=new URL(d.checkoutUrl);if(url.protocol!=='https:'||url.hostname!=='buy.stripe.com'||url.username||url.password||d.amount!==299||d.currency!=='eur')throw Error('Não foi possível validar a ligação de pagamento.');byId('admission-checkout').href=url.href;byId('admission-checkout').hidden=false;status.textContent='Email confirmado. A conta será ativada após confirmação do pagamento.';token='';}
 catch(error){status.textContent=error.message;button.disabled=false;}
});
})();
