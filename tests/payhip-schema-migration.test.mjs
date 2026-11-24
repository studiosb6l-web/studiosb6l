import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {applyPayhipSchema} from '../scripts/apply-payhip-schema.mjs';
const migrationSQL=fs.readFileSync(new URL('../cloudflare/migrations/006_payhip_admission.sql',import.meta.url),'utf8');
const recovery={available:true,bookmark:'00000019-00000004-0000512d-3f2cffaceed8ad5de1e6ac3bf681b26a',checkedAt:new Date().toISOString()};
const env={CLOUDFLARE_API_TOKEN:'fixture-never-real'};
function setup({writes=0,readable=true,bytes=1000}={}){
 const sql=new DatabaseSync(':memory:');sql.exec("CREATE TABLE accounts(id TEXT PRIMARY KEY);INSERT INTO accounts VALUES('preserved');");let mutations=0;
 const transport=async(url,options)=>{let result;const data=options.body?JSON.parse(options.body):null;
 if(url.endsWith('/graphql')){return new Response(JSON.stringify(readable?{data:{viewer:{accounts:[{d1AnalyticsAdaptiveGroups:[{sum:{rowsRead:30,rowsWritten:writes}}]}]}}}:{errors:[{message:'Forbidden'}]}));}
 if(url.includes('?per_page='))result=[{uuid:'f53175d9-50a7-4b6a-a868-1b10c997efc8'}];
 else if(url.endsWith('/query')){if(data.sql.includes('CREATE TABLE')){mutations++;sql.exec(data.sql);result=[{success:true,results:[],meta:{rows_written:5,rows_read:0}}];}else result=[{success:true,results:sql.prepare(data.sql).all(...data.params)}];}
 else result={file_size:bytes};return new Response(JSON.stringify({success:true,result}));};return {sql,transport,mutations:()=>mutations};
}
test('approved migration creates only its two tables and retains existing account rows',async()=>{const s=setup();const r=await applyPayhipSchema(env,s.transport,{recovery,migrationSQL});assert.equal(r.verifiedTables.length,2);assert.equal(r.createdTables.length,2);assert.equal(r.registrationActivated,false);assert.equal(s.sql.prepare('SELECT id FROM accounts').get().id,'preserved');const again=await applyPayhipSchema(env,s.transport,{recovery,migrationSQL});assert.equal(again.createdTables.length,0);});
test('absent recovery or a different SQL file causes no network access',async()=>{let calls=0;const transport=async()=>{calls++;throw Error('must not call')};for(const opts of [{migrationSQL,recovery:null},{migrationSQL:migrationSQL+'\n',recovery}])await assert.rejects(()=>applyPayhipSchema(env,transport,opts));assert.equal(calls,0);});
test('unknown metrics, exhausted daily writes or insufficient storage prevent all mutations',async()=>{for(const opts of [{readable:false},{writes:69500},{bytes:3500000000}]){const s=setup(opts);await assert.rejects(()=>applyPayhipSchema(env,s.transport,{recovery,migrationSQL}));assert.equal(s.mutations(),0);}});
test('an existing incompatible table is never overwritten',async()=>{const s=setup();s.sql.exec('CREATE TABLE payhip_admission_payments(wrong TEXT)');await assert.rejects(()=>applyPayhipSchema(env,s.transport,{recovery,migrationSQL}),/differs/);assert.equal(s.mutations(),0);});
