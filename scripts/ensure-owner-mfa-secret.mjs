// Runs only in the authenticated deployment job. Secret stays in process memory
// and Wrangler stdin; never in an argument, file, console, response or artifact.
import {spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
const cli='node_modules/wrangler/bin/wrangler.js';
const list=spawnSync(process.execPath,[cli,'secret','list','--format','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
if(list.status!==0)throw Error('Cannot verify existing Worker encryption secret names');
let secrets;try{secrets=JSON.parse(list.stdout);}catch{throw Error('Cannot parse Worker secret name inventory');}
if(!Array.isArray(secrets))throw Error('Invalid Worker secret name inventory');
if(secrets.some(s=>s.name==='OWNER_MFA_ENCRYPTION_KEY')){
 console.log('Existing owner MFA encryption secret preserved.');
}else{
 const key=randomBytes(32).toString('base64url');
 const put=spawnSync(process.execPath,[cli,'secret','put','OWNER_MFA_ENCRYPTION_KEY'],{input:key+'\n',encoding:'utf8',stdio:['pipe','pipe','pipe']});
 if(put.status!==0)throw Error('Owner MFA encryption secret installation failed');
 console.log('Owner MFA encryption secret installed without exposing its value.');
}
