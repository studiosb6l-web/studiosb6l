import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/account-onboarding.js',import.meta.url),'utf8');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function page({hash='',reply=()=>Response.json({success:true,registrationEnabled:true})}={}){
 const nodes=new Map(),calls=[],historyCalls=[];
 function node(id){if(!nodes.has(id))nodes.set(id,{id,hidden:['registration-panel','verification-panel','verification-recovery','admission-checkout','after-checkout','retry-registration'].includes(id),disabled:false,value:'',checked:false,textContent:'',events:{},addEventListener(event,fn){this.events[event]=fn;},querySelector(){return node(id+'-button');}});return nodes.get(id);}
 const context={window:{addEventListener(){}},document:{getElementById:node},location:{hash,pathname:'/conta/',search:''},history:{replaceState(...args){historyCalls.push(args);}},URL,URLSearchParams,fetch:async(url,options)=>{calls.push({path:new URL(url).pathname,options});return reply(new URL(url).pathname,options);}};
 vm.runInNewContext(source,context);await flush();
 return{node,calls,historyCalls,click:async id=>{const button=node(id);await button.events.click({target:button});await flush();}};
}
test('registration readiness visibly distinguishes available, disabled and unreachable service',async()=>{
 const active=await page();assert.equal(active.node('registration-panel').hidden,false);assert.match(active.node('registration-readiness').textContent,/Inscrições disponíveis/);
 const disabled=await page({reply:()=>Response.json({success:true,registrationEnabled:false})});assert.equal(disabled.node('registration-panel').hidden,true);assert.match(disabled.node('registration-readiness').textContent,/temporariamente indisponíveis/);assert.equal(disabled.node('retry-registration').hidden,false);
 const offline=await page({reply:()=>{throw Error('offline');}});assert.equal(offline.node('registration-panel').hidden,true);assert.equal(offline.node('retry-registration').hidden,false);
});
test('readiness retry can restore the form after a temporary failure',async()=>{
 let available=false;const p=await page({reply:()=>Response.json({success:true,registrationEnabled:available})});available=true;await p.click('retry-registration');assert.equal(p.node('registration-panel').hidden,false);assert.equal(p.node('retry-registration').hidden,true);
});
test('confirmation token is removed from URL and only verified checkout exposes payment and return steps',async()=>{
 const token='a'.repeat(43);const p=await page({hash:'#verify='+token,reply:path=>{assert.equal(path,'/api/auth/verify-email');return Response.json({success:true,checkoutUrl:'https://payhip.com/b/fixture',amount:299,currency:'eur'});}});
 assert.equal(p.historyCalls[0][2],'/conta/');assert.equal(p.calls.length,0);assert.equal(p.node('admission-checkout').hidden,true);await p.click('verify-email');assert.equal(p.node('admission-checkout').hidden,false);assert.equal(p.node('admission-checkout').href,'https://payhip.com/b/fixture');assert.equal(p.node('after-checkout').hidden,false);assert.equal(p.node('verify-email').hidden,true);assert.deepEqual(JSON.parse(p.calls[0].options.body),{token});
});
test('expired or used confirmation provides recovery without a payment link',async()=>{
 const p=await page({hash:'#verify='+'a'.repeat(43),reply:()=>Response.json({success:false},{status:400})});await p.click('verify-email');assert.equal(p.node('verification-recovery').hidden,false);assert.equal(p.node('admission-checkout').hidden,true);assert.equal(p.node('after-checkout').hidden,true);assert.match(p.node('verification-status').textContent,/já foi utilizada/);
});
test('wrong checkout host, embedded credentials, unexpected amount and currency never expose payment',async()=>{
 for(const patch of [{checkoutUrl:'https://evil.test/b/fixture'},{checkoutUrl:'https://user:pass@payhip.com/b/fixture'},{checkoutUrl:'https://payhip.com/b/fixture?extra=1'},{amount:300},{currency:'usd'}]){
  const p=await page({hash:'#verify='+'a'.repeat(43),reply:()=>Response.json({success:true,checkoutUrl:'https://payhip.com/b/fixture',amount:299,currency:'eur',...patch})});await p.click('verify-email');assert.equal(p.node('admission-checkout').hidden,true);assert.equal(p.node('after-checkout').hidden,true);assert.equal(p.node('verification-recovery').hidden,false);
 }
});
test('registration submits consent and selected role and clears password after submission',async()=>{
 const p=await page({reply:path=>Response.json(path==='/api/auth/status'?{success:true,registrationEnabled:true}:{success:true,message:'Consulta o teu email.'},{status:path==='/api/auth/status'?200:202})});p.node('register-email').value=' fixture@invalid.example ';p.node('register-password').value='Example password for offline test';p.node('register-role').value='artist';p.node('register-consent').checked=true;
 await p.node('registration-form').events.submit({preventDefault(){},target:p.node('registration-form')});const sent=JSON.parse(p.calls.at(-1).options.body);assert.equal(sent.email,'fixture@invalid.example');assert.equal(sent.acceptTerms,true);assert.equal(sent.role,'artist');assert.equal(p.node('register-password').value,'');assert.equal(p.node('admission-checkout').hidden,true);assert.equal(p.node('registration-form-button').disabled,false);
});
