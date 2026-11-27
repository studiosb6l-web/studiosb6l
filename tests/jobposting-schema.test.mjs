import test from 'node:test';
import assert from 'node:assert/strict';
import {buildJobPosting, serializeJobPosting} from '../assets/jobposting-schema.mjs';
const now = Date.parse('2026-11-27T00:00:00Z');
const job = {kind:'employment', verified:true, authorized:true, publicAccess:true, freeApplication:true, applicationAvailable:true, title:'Sound engineer', description:'Recording engineer', employer:'Example test employer', datePosted:'2026-11-26', validThrough:'2026-12-30', location:{country:'ES',locality:'Barcelona'}};
test('eligible job',()=>assert.equal(buildJobPosting(job,now)['@type'],'JobPosting'));
test('reject ineligible jobs',()=>{for(const key of ['verified','authorized','publicAccess','freeApplication','applicationAvailable']) assert.equal(buildJobPosting({...job,[key]:false},now),null); assert.equal(buildJobPosting({...job,kind:'training'},now),null); assert.equal(buildJobPosting({...job,validThrough:'2026-11-26'},now),null); assert.equal(buildJobPosting({...job,employer:''},now),null);});
test('escape script closing tags',()=>{const schema=buildJobPosting({...job,description:'</script>'},now); const json=serializeJobPosting(schema); assert.equal(json.includes('<'),false); assert.deepEqual(JSON.parse(json),schema);});
