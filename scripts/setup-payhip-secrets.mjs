import {randomBytes} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const base='https://api.cloudflare.com/client/v4/accounts/8ada1c4a636906c35b369d4d682f6d4e/workers/scripts/studiosb6l-artists-api';
export async function setupPayhipSecrets(env=process.env,transport=fetch,generate=()=>randomBytes(32).toString('base64url')){
 if(typeof env.CLOUDFLARE_API_TOKEN!=='string'||env.CLOUDFLARE_API_TOKEN.length<20)throw Error('Missing CLOUDFLARE_API_TOKEN secret');
 if(typeof env.PAYHIP_WEBHOOK_API_KEY!=='string'||env.PAYHIP_WEBHOOK_API_KEY.length<32||env.PAYHIP_WEBHOOK_API_KEY.trim()!==env.PAYHIP_WEBHOOK_API_KEY)throw Error('Store PAYHIP_WEBHOOK_API_KEY in GitHub Actions Secrets before continuing');
 async function api(suffix,body){
  let r;try{r=await transport(base+suffix,{method:body?'PUT':'GET',redirect:'error',signal:AbortSignal.timeout(15000),headers:{Authorization:'Bearer '+env.CLOUDFLARE_API_TOKEN,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});}catch{throw Error('Cloudflare connection failed; no automatic retry');}
  const data=await r.json().catch(()=>null);if(!r.ok||data?.success!==true)throw Error('Cloudflare configuration request failed (HTTP '+r.status+')');return data.result;
 }
 const settings=await api('/settings');const bindings=settings?.bindings;
 if(!Array.isArray(bindings)||!bindings.some(b=>b.name==='DB'&&b.type==='d1'&&b.id==='f53175d9-50a7-4b6a-a868-1b10c997efc8'))throw Error('Wrong target binding; no changes permitted');
 if(bindings.some(b=>['REGISTRATION_ENABLED','PAYHIP_ACTIVATION_VERIFIED'].includes(b.name)&&b.type==='plain_text'&&b.text==='true'))throw Error('Active registration requires a separate reviewed secret change');
 const retained=[],added=[];
 for(const name of ['PAYHIP_WEBHOOK_API_KEY','ADMISSION_REFERENCE_SECRET']){
  if(bindings.some(b=>b.name===name)){retained.push(name);continue;}
  const value=name==='PAYHIP_WEBHOOK_API_KEY'?env.PAYHIP_WEBHOOK_API_KEY:generate();
  if(typeof value!=='string'||value.length<32)throw Error('Invalid generated secret');
  await api('/secrets',{name,text:value,type:'secret_text'});added.push(name);
 }
 const after=await api('/settings');
 if(!['PAYHIP_WEBHOOK_API_KEY','ADMISSION_REFERENCE_SECRET'].every(name=>after.bindings?.some(b=>b.name===name&&b.type==='secret_text')))throw Error('Secret metadata not confirmed; inspect before retry');
 return {addedNames:added,retainedNames:retained,metadataVerified:true,registrationActivated:false,webhookConfigured:false,paymentTested:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{const result=await setupPayhipSecrets();console.log(JSON.stringify(result));}
 catch(error){console.error(error.message);process.exitCode=1;}
}
