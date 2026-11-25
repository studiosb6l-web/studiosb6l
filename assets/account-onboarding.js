(()=>{'use strict';
const api='https://studiosb6l-artists-api.studiosb6l.workers.dev';
const byId=id=>document.getElementById(id);
const areaRoles={musician:'artist',singer:'artist',band:'artist',composer:'artist',producer:'producer',audio_engineer:'producer',mastering:'producer',teacher:'artist',school:'company',conservatory:'company',student:'student',promoter:'promoter',venue:'venue',company:'company'};
const requestedArea=new URLSearchParams(location.search).get('area');
if(Object.hasOwn(areaRoles,requestedArea)){byId('register-role').value=areaRoles[requestedArea];for(const option of (byId('register-role').options||[]))option.selected=option.dataset.area===requestedArea;}
// Email links also work when this account page is already open in the same tab.
window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#verify='))location.reload();});
let token=location.hash.startsWith('#verify=')?location.hash.slice(8):'';
if(token){history.replaceState(null,'',location.pathname+location.search);byId('verification-panel').hidden=false;byId('registration-availability').hidden=true;}
async function call(path,payload){
 const r=await fetch(api+path,{method:payload?'POST':'GET',mode:'cors',credentials:'omit',cache:'no-store',headers:payload?{'Content-Type':'application/json'}:{},body:payload?JSON.stringify(payload):undefined});
 const d=await r.json().catch(()=>null);
 if(!r.ok||d?.success!==true){const error=Error(r.status===429?'Aguarda um minuto antes de tentar novamente.':r.status===400?'Verifica os dados introduzidos e tenta novamente.':'Serviço temporariamente indisponível. Tenta novamente mais tarde.');error.status=r.status;throw error;}
 return d;
}
async function readiness(){
 const retry=byId('retry-registration'),status=byId('registration-readiness');retry.disabled=true;status.textContent='A verificar a disponibilidade das inscrições…';
 try{const d=await call('/api/auth/status');const enabled=d.registrationEnabled===true;byId('registration-panel').hidden=!enabled||!!token;status.textContent=enabled?'Inscrições disponíveis. Confirma o email antes de pagar.':'Novas inscrições temporariamente indisponíveis. Se já tens conta, usa o portal de acesso acima.';retry.hidden=enabled;}
 catch{byId('registration-panel').hidden=true;status.textContent='Não foi possível verificar a disponibilidade. Tenta novamente ou contacta o apoio.';retry.hidden=false;}
 finally{retry.disabled=false;}
}
// Availability controls the form; only the server may enable or activate an account.
if(!token)readiness();
byId('retry-registration').addEventListener('click',readiness);
byId('registration-form').addEventListener('submit',async e=>{
 e.preventDefault();const button=e.target.querySelector('button'),status=byId('registration-status');button.disabled=true;status.textContent='A enviar confirmação…';
 try{const d=await call('/api/auth/register',{email:byId('register-email').value.trim(),password:byId('register-password').value,role:byId('register-role').value,area:Object.hasOwn(areaRoles,requestedArea)?requestedArea:byId('register-role').selectedOptions?.[0]?.dataset.area,acceptTerms:byId('register-consent').checked});status.textContent=d.message||'Consulta o teu email para continuar. Verifica também a pasta de spam.';}
 catch(error){status.textContent=error.message;}
 finally{byId('register-password').value='';button.disabled=false;}
});
byId('verify-email').addEventListener('click',async e=>{
 const button=e.target,status=byId('verification-status');button.disabled=true;
 try{
  if(!/^[A-Za-z0-9_-]{43}$/.test(token)){const error=Error('Ligação inválida ou expirada. Pede uma nova confirmação.');error.status=400;throw error;}
  const d=await call('/api/auth/verify-email',{token});
  const url=new URL(d.checkoutUrl);
  if(url.protocol!=='https:'||url.hostname!=='payhip.com'||!/^\/b\/[A-Za-z0-9]+$/.test(url.pathname)||url.search||url.hash||url.username||url.password||d.amount!==299||d.currency!=='eur')throw Error('Não foi possível validar a ligação de pagamento.');
  byId('admission-checkout').href=url.href;byId('admission-checkout').hidden=false;byId('after-checkout').hidden=false;const back=byId('account-return');if(back&&Object.hasOwn(areaRoles,requestedArea))back.href='https://studiosb6l-artists-api.studiosb6l.workers.dev/conta/?area='+requestedArea;
  status.textContent='Email confirmado. Continua para o Payhip e paga uma única vez, com o mesmo email da conta. O acesso ficará disponível após confirmação do pagamento.';token='';button.hidden=true;
 }catch(error){
  status.textContent=error.status===400?'Esta ligação é inválida, expirou ou já foi utilizada. Pede uma nova confirmação no registo.':error.message;
  byId('verification-recovery').hidden=false;button.disabled=false;
 }
});
})();
