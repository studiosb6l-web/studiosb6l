import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const account='8ada1c4a636906c35b369d4d682f6d4e',database='f53175d9-50a7-4b6a-a868-1b10c997efc8';
const digest='fc7c23d91e42072cee0e034c6c2f37b12e477f4c5b57e5d6a2c6d6db8ddcf14e';
const normalize=s=>s.replace(/IF NOT EXISTS\s+/gi,'').replace(/\s+/g,' ').trim().replace(/;$/,'');
export async function applyPayhipSchema(env=process.env,transport=fetch,{recovery,migrationSQL}={}){
 if(!env.CLOUDFLARE_API_TOKEN)throw Error('Missing credential');
 if(!recovery?.available||typeof recovery.bookmark!=='string'||!/^[0-9a-f-]{20,}$/i.test(recovery.bookmark)||!Number.isFinite(Date.parse(recovery.checkedAt))||Math.abs(Date.now()-Date.parse(recovery.checkedAt))>30*60*1000)throw Error('A recent preserved recovery bookmark is required');
 if(typeof migrationSQL!=='string'||createHash('sha256').update(migrationSQL).digest('hex')!==digest)throw Error('Migration checksum mismatch');
 const statements=migrationSQL.replace(/^--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean);
 const expected=new Map(statements.map(s=>[s.match(/^CREATE TABLE IF NOT EXISTS (payhip_admission_(?:payments|refunds))\b/)?.[1],normalize(s)]));
 if(expected.size!==2||expected.has(undefined))throw Error('Only approved Payhip tables may be created');
 const headers={Authorization:'Bearer '+env.CLOUDFLARE_API_TOKEN,'Content-Type':'application/json'};
 const base='https://api.cloudflare.com/client/v4';
 async function api(path,body){
  const r=await transport(base+path,{method:body?'POST':'GET',headers,redirect:'error',signal:AbortSignal.timeout(15000),body:body?JSON.stringify(body):undefined});
  const d=await r.json().catch(()=>null);if(!r.ok||d?.success===false||d?.errors?.length)throw Error('Cloudflare request failed (HTTP '+r.status+'); no automatic retry');return d;
 }
 const list=await api('/accounts/'+account+'/d1/database?per_page=100&page=1');
 if(list.success!==true||!Array.isArray(list.result)||list.result.length>7||list.result_info?.total_pages>1||list.result_info?.total_count>list.result.length)throw Error('Cannot verify database count below free seventy-percent cap');
 let bytes=0;
 for(const db of list.result){if(!/^[0-9a-f-]{36}$/i.test(db.uuid||''))throw Error('Unknown database identifier');const info=await api('/accounts/'+account+'/d1/database/'+db.uuid);const n=info.result?.file_size;if(info.success!==true||!Number.isSafeInteger(n)||n<0)throw Error('Storage measurement unavailable');bytes+=n;}
 if(!list.result.some(x=>x.uuid===database)||bytes+1048576>3500000000)throw Error('Storage headroom below required margin');
 const day=new Date().toISOString().slice(0,10);
 const query='query DailyD1($accountTag: string!, $day: Date!) { viewer { accounts(filter: {accountTag: $accountTag}) { d1AnalyticsAdaptiveGroups(limit: 1, filter: {date_geq: $day, date_leq: $day}) { sum { rowsRead rowsWritten } } } } }';
 const usage=await api('/graphql',{query,variables:{accountTag:account,day}});
 const groups=usage.data?.viewer?.accounts?.[0]?.d1AnalyticsAdaptiveGroups;
 if(!Array.isArray(groups))throw Error('Daily D1 usage unavailable');
 let reads=0,writes=0;for(const g of groups){if(!Number.isSafeInteger(g.sum?.rowsRead)||!Number.isSafeInteger(g.sum?.rowsWritten)||g.sum.rowsRead<0||g.sum.rowsWritten<0)throw Error('Invalid D1 metrics');reads+=g.sum.rowsRead;writes+=g.sum.rowsWritten;}
 if(reads+1000>3500000||writes+1000>70000)throw Error('Daily D1 usage too close to seventy-percent cap');
 const path='/accounts/'+account+'/d1/database/'+database+'/query';
 const select={sql:"SELECT name,sql FROM sqlite_master WHERE type='table' AND name IN (?,?)",params:[...expected.keys()]};
 function checkedRows(d){if(d.success!==true||!Array.isArray(d.result)||d.result.some(x=>x.success===false)||!Array.isArray(d.result[0]?.results))throw Error('Schema could not be verified');return d.result[0].results;}
 const before=checkedRows(await api(path,select));
 for(const row of before){if(!expected.has(row.name)||normalize(row.sql)!==expected.get(row.name))throw Error('An existing Payhip table differs from the reviewed schema');}
 const changed=await api(path,{sql:migrationSQL,params:[]});
 if(changed.success!==true||!Array.isArray(changed.result)||changed.result.some(x=>x.success===false))throw Error('Migration result is incomplete; inspect before retry');
 const after=checkedRows(await api(path,select));
 if(after.length!==2||after.some(row=>normalize(row.sql)!==expected.get(row.name)))throw Error('Post-migration verification failed');
 return {database,utcDay:day,recoveryBookmark:recovery.bookmark,recoveryCheckedAt:recovery.checkedAt,usageBefore:{rowsRead:reads,rowsWritten:writes,totalStorageBytes:bytes,databases:list.result.length},createdTables:[...expected.keys()].filter(name=>!before.some(x=>x.name===name)),verifiedTables:after.map(x=>x.name),migrationRowsRead:changed.result.reduce((n,x)=>n+Number(x.meta?.rows_read||0),0),migrationRowsWritten:changed.result.reduce((n,x)=>n+Number(x.meta?.rows_written||0),0),registrationActivated:false,workerDeployed:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{const recovery=JSON.parse(fs.readFileSync('.wrangler/access-check/recovery.json','utf8'));const migrationSQL=fs.readFileSync('cloudflare/migrations/006_payhip_admission.sql','utf8');const result=await applyPayhipSchema(process.env,fetch,{recovery,migrationSQL});fs.writeFileSync('.wrangler/access-check/payhip-migration-006.json',JSON.stringify(result,null,2));console.log('Reviewed Payhip migration verified. Registration remains disabled; no Worker deployment.');}
 catch(error){console.error(error.message);process.exitCode=1;}
}
