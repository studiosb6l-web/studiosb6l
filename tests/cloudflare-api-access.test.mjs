import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyCloudflareAccess} from '../scripts/cloudflare-api-access.mjs';
const env={CLOUDFLARE_API_TOKEN:'fixture-not-a-real-cloudflare-token'};
function transport(settings={bindings:[{name:'DB',type:'d1',id:'f53175d9-50a7-4b6a-a868-1b10c997efc8'}]},deployments={deployments:[{versions:[{version_id:'fixture-version',percentage:100}]}]}){
 let n=0;return async(url,options)=>{assert.equal(options.method,'GET');assert.equal(options.redirect,'error');assert.match(url,/^https:\/\/api.cloudflare.com\/client\/v4\/accounts\/8ada1c4a636906c35b369d4d682f6d4e\/workers\/scripts\/studiosb6l-artists-api\/(settings|deployments)$/);assert.equal(options.headers.Authorization,'Bearer '+env.CLOUDFLARE_API_TOKEN);return new Response(JSON.stringify({success:true,result:n++===0?settings:deployments}));};
}
test('API preflight makes only fixed read requests and returns rollback identifiers, never secrets',async()=>{const result=await verifyCloudflareAccess(env,transport());assert.equal(result.readAccessVerified,true);assert.equal(result.previousVersions[0].id,'fixture-version');assert.equal(JSON.stringify(result).includes(env.CLOUDFLARE_API_TOKEN),false);});
test('missing API credentials cause no network requests',async()=>{let called=false;await assert.rejects(()=>verifyCloudflareAccess({},async()=>{called=true;}),/Falta o segredo/);assert.equal(called,false);});
test('wrong target binding, provider denial or absent rollback record fail closed',async()=>{await assert.rejects(()=>verifyCloudflareAccess(env,transport({bindings:[{name:'DB',type:'d1',id:'another-database'}]})),/não corresponde/);await assert.rejects(()=>verifyCloudflareAccess(env,async()=>new Response('{}',{status:403})),/HTTP 403/);await assert.rejects(()=>verifyCloudflareAccess(env,transport(undefined,{deployments:[]})),/versões atuais/);});
