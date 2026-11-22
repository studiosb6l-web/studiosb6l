// Run locally: node --test tests/artists-registration-worker.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../cloudflare/artists-registration-worker.js',import.meta.url),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const origin='https://www.studiosb6l.com';
const good={type:'Artista',name:'Artista de Teste',email:'artist@example.com',country:'Portugal',website:'https://example.com',biography:'Biografia',consent:true};
function mockDB(){const calls=[];return {calls,prepare(sql){return {bind(...args){return {async run(){calls.push({sql,args});return {success:true}}}}}}}}
function request(body=good,headers={},url='https://api.example.com/api/applications'){return new Request(url,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:JSON.stringify(body)})}
test('valid application is stored pending, never approved',async()=>{const DB=mockDB();const r=await worker.fetch(request(),{DB});assert.equal(r.status,201);assert.equal((await r.json()).status,'pending');assert.equal(DB.calls.length,1);assert.match(DB.calls[0].sql,/pending/);assert.equal(DB.calls[0].args[0],good.name)});
test('database missing fails closed',async()=>{const r=await worker.fetch(request(),{});assert.equal(r.status,503)});
test('foreign origin rejected',async()=>{const DB=mockDB();const r=await worker.fetch(request(good,{Origin:'https://evil.example'}),{DB});assert.equal(r.status,403);assert.equal(DB.calls.length,0)});
test('invalid consent rejected',async()=>{const DB=mockDB();const r=await worker.fetch(request({...good,consent:false}),{DB});assert.equal(r.status,422);assert.equal(DB.calls.length,0)});
test('invalid email rejected',async()=>{const DB=mockDB();const r=await worker.fetch(request({...good,email:'invalid'}),{DB});assert.equal(r.status,422)});
test('unsafe website rejected',async()=>{const DB=mockDB();const r=await worker.fetch(request({...good,website:'http://127.0.0.1/private'}),{DB});assert.equal(r.status,422)});
test('oversized application rejected',async()=>{const DB=mockDB();const r=await worker.fetch(request({...good,biography:'a'.repeat(12001)}),{DB});assert.equal(r.status,413)});
test('unsupported route rejected',async()=>{const DB=mockDB();const r=await worker.fetch(request(good,{},'https://api.example.com/api/admin'),{DB});assert.equal(r.status,404)});
test('duplicate email rejected',async()=>{const DB={prepare(){return {bind(){return {async run(){throw Error('UNIQUE constraint failed: artists.email')}}}}}};const r=await worker.fetch(request(),{DB});assert.equal(r.status,409)});

test('missing Origin rejected',async()=>{const DB=mockDB();const r=new Request('https://api.example.com/api/applications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(good)});const out=await worker.fetch(r,{DB});assert.equal(out.status,403);assert.equal(DB.calls.length,0)});
test('malformed JSON rejected without DB write',async()=>{const DB=mockDB();const r=new Request('https://api.example.com/api/applications',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{invalid'});const out=await worker.fetch(r,{DB});assert.equal(out.status,400);assert.equal(DB.calls.length,0)});
test('non JSON content type rejected',async()=>{const DB=mockDB();const out=await worker.fetch(request(good,{'Content-Type':'text/plain'}),{DB});assert.equal(out.status,415);assert.equal(DB.calls.length,0)});
test('honeypot rejects automated submissions',async()=>{const DB=mockDB();const out=await worker.fetch(request({...good,company_fax:'spam'}),{DB});assert.equal(out.status,422);assert.equal(DB.calls.length,0)});
test('CORS preflight rejects foreign origin',async()=>{const r=new Request('https://api.example.com/api/applications',{method:'OPTIONS',headers:{Origin:'https://evil.example'}});const out=await worker.fetch(r,{});assert.equal(out.status,403)});
test('CORS preflight accepts official origin',async()=>{const r=new Request('https://api.example.com/api/applications',{method:'OPTIONS',headers:{Origin:origin}});const out=await worker.fetch(r,{});assert.equal(out.status,204)});

test('public health response does not reveal database configuration',async()=>{const a=await worker.fetch(new Request('https://api.example.com/'),{});const b=await worker.fetch(new Request('https://api.example.com/'),{DB:mockDB()});assert.equal(a.status,200);assert.equal(b.status,200);assert.deepEqual(await a.json(),await b.json());assert.equal(a.headers.get('Cache-Control'),'no-store')});
test('unsafe localhost website rejected',async()=>{const DB=mockDB();const r=await worker.fetch(request({...good,website:'http://localhost:8787'}),{DB});assert.equal(r.status,422);assert.equal(DB.calls.length,0)});
test('website credentials rejected',async()=>{const DB=mockDB();const r=await worker.fetch(request({...good,website:'https://user:pass@example.com'}),{DB});assert.equal(r.status,422);assert.equal(DB.calls.length,0)});
test('unsupported category rejected',async()=>{const DB=mockDB();const r=await worker.fetch(request({...good,type:'Administrador'}),{DB});assert.equal(r.status,422);assert.equal(DB.calls.length,0)});

test('emergency STOP suspends registrations without writing to DB',async()=>{const DB=mockDB();const r=await worker.fetch(request(),{DB,STOP_REGISTRATIONS:'true'});assert.equal(r.status,503);assert.equal(DB.calls.length,0);assert.match((await r.json()).error,/suspended/i)});
test('emergency STOP cannot be overridden by submitted form fields',async()=>{const DB=mockDB();const r=await worker.fetch(request({...good,STOP_REGISTRATIONS:'false'}),{DB,STOP_REGISTRATIONS:'true'});assert.equal(r.status,503);assert.equal(DB.calls.length,0)});
test('STOP does not disclose admin controls',async()=>{const r=await worker.fetch(new Request('https://api.example.com/api/admin/stop',{method:'GET'}),{STOP_REGISTRATIONS:'true'});assert.equal(r.status,404)});

test('CORS preflight rejects unsupported paths',async()=>{const r=new Request('https://api.example.com/api/admin',{method:'OPTIONS',headers:{Origin:origin}});const out=await worker.fetch(r,{});assert.equal(out.status,404)});
