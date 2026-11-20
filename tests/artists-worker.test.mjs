// Offline tests: no real D1 writes or production requests.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const code = await readFile('cloudflare/artists-registration-worker.js','utf8');
const {default: worker} = await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const origin='https://www.studiosb6l.com';
const call=(path,method='GET',body,db)=>worker.fetch(new Request('https://worker.example'+path,{method,headers:method==='POST'?{'Origin':origin,'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined}),{DB:db});
const health=await call('/');
assert.equal((await health.json()).database,'missing');
const missing=await call('/api/applications','POST',{});
assert.equal(missing.status,503);
const db={prepare(){return {bind(){return {run:async()=>({success:true})}}}}};
const bad=await call('/api/applications','POST',{name:'X',email:'bad',consent:false},db);
assert.equal(bad.status,422);
const good=await call('/api/applications','POST',{name:'Test Artist',email:'test@example.org',type:'Artista',consent:true},db);
assert.equal(good.status,201);
const unknown=await call('/not-found');
assert.equal(unknown.status,404);
console.log('Worker offline contract tests passed');
