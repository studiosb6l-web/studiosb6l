import test from 'node:test';
import assert from 'node:assert/strict';
import api from '../cloudflare/artists-api-entry.mjs';
test('PRO access route rejects unauthenticated requests',async()=>{
  const response=await api.fetch(new Request('https://www.studiosb6l.com/api/pro/access?capability=opportunities:alerts'),{});
  assert.equal(response.status,401);
  assert.equal((await response.json()).success,false);
});
test('PRO access route rejects foreign origin before querying account data',async()=>{
  const response=await api.fetch(new Request('https://www.studiosb6l.com/api/pro/access',{headers:{Origin:'https://evil.example'}}),{});
  assert.equal(response.status,403);
});
test('STOP_SERVICE blocks PRO access route',async()=>{
  const response=await api.fetch(new Request('https://www.studiosb6l.com/api/pro/access'),{STOP_SERVICE:'true'});
  assert.equal(response.status,503);
});
