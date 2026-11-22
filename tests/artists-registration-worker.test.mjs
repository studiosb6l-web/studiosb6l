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
