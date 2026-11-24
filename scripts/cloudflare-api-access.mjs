// Read-only credential/target check. Never prints API responses or credentials.
const account='8ada1c4a636906c35b369d4d682f6d4e';
const worker='studiosb6l-artists-api';
const database='f53175d9-50a7-4b6a-a868-1b10c997efc8';
export async function verifyCloudflareAccess(env=process.env,transport=fetch){
 const token=env.CLOUDFLARE_API_TOKEN;
 if(typeof token!=='string'||token.trim().length<20)throw Error('Falta o segredo CLOUDFLARE_API_TOKEN no GitHub. Nenhuma alteração executada.');
 async function get(path){
  const r=await transport('https://api.cloudflare.com/client/v4'+path,{method:'GET',redirect:'error',signal:AbortSignal.timeout(15000),headers:{Authorization:'Bearer '+token,Accept:'application/json'}});
  if(!r.ok)throw Error('Cloudflare recusou a verificação de acesso (HTTP '+r.status+'). Nenhuma alteração executada.');
  const data=await r.json();if(data.success!==true)throw Error('Cloudflare não confirmou o acesso. Nenhuma alteração executada.');return data.result;
 }
 // Target-specific access supports a scoped token without account-wide discovery.
 const settings=await get('/accounts/'+account+'/workers/scripts/'+worker+'/settings');
 if(!settings?.bindings?.some(b=>b.name==='DB'&&b.type==='d1'&&b.id===database))throw Error('A ligação D1 do Worker não corresponde ao destino aprovado. Publicação bloqueada.');
 const deployments=await get('/accounts/'+account+'/workers/scripts/'+worker+'/deployments');
 const previous=deployments?.deployments?.[0];
 if(!previous?.versions?.length||previous.versions.some(v=>!v.version_id))throw Error('Não foi possível identificar as versões atuais para reversão. Publicação bloqueada.');
 return {account,worker,database,readAccessVerified:true,previousVersions:previous.versions.map(v=>({id:v.version_id,percentage:v.percentage})),productionRegistrationEnabled:settings.bindings.some(b=>b.name==='REGISTRATION_ENABLED'&&b.type==='plain_text'&&b.text==='true')};
}
if(import.meta.url===new URL(process.argv[1],'file:').href){
 try{const result=await verifyCloudflareAccess();const {mkdirSync,writeFileSync}=await import('node:fs');mkdirSync('.wrangler/access-check',{recursive:true});writeFileSync('.wrangler/access-check/target.json',JSON.stringify(result,null,2)+'\n');console.log('Acesso de leitura confirmado ao Worker aprovado; versões anteriores guardadas. Nenhum recurso foi alterado.');}
 catch(error){console.error(error.message);process.exitCode=1;}
}
