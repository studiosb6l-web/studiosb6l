// Run with: node --test tests/network-discovery.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/network-discovery-worker.js';
const makeDb = (rows=[]) => ({
 prepare(sql) {
  return {bind(...params) {
   return {async all() {
    assert.match(sql,/verification_status='verified'/);
    assert.match(sql,/LIMIT \?4 OFFSET \?5/);
    assert.equal(params.length,5);
    return {results:rows};
   }};
  }};
 }
});
const request=(path,method='GET')=>new Request('https://example.workers.dev'+path,{method});
test('only supported read routes are exposed',async()=>{
 const res=await worker.fetch(request('/api/network/messages'),{DB:makeDb()});
 assert.equal(res.status,404);
});
test('private write requests are rejected',async()=>{
 const res=await worker.fetch(request('/api/network/talents','POST'),{DB:makeDb()});
 assert.equal(res.status,405);
});
test('missing database is handled without leaking internals',async()=>{
 const res=await worker.fetch(request('/api/network/talents'),{});
 assert.equal(res.status,503);
});
test('verified talents listing has bounded pagination',async()=>{
 const res=await worker.fetch(request('/api/network/talents?limit=999&page=2'),{DB:makeDb([{id:'test',display_name:'Artist',role:'artist'}])});
 assert.equal(res.status,200);
 const data=await res.json();
 assert.equal(data.limit,30); assert.equal(data.page,2); assert.equal(data.items.length,1);
});
test('invalid talent roles are rejected',async()=>{
 const res=await worker.fetch(request('/api/network/talents?role=admin'),{DB:makeDb()});
 assert.equal(res.status,400);
});
test('published opportunities require verified owners',async()=>{
 const res=await worker.fetch(request('/api/network/opportunities'),{DB:makeDb([])});
 assert.equal(res.status,200);
 assert.deepEqual((await res.json()).items,[]);
});
