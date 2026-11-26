import test from 'node:test';
import assert from 'node:assert/strict';
import {loadProfessionalMembership} from '../cloudflare/professional-membership.mjs';
import {effectivePlan} from '../cloudflare/ambassador-session-policy.mjs';
const now=1000;
function fixture(grant,paid){
 const queries=[];
 const env={AMBASSADOR_ENABLED:'true',PAID_SUBSCRIPTIONS_VERIFIED:'true',DB:{prepare(sql){queries.push(sql);return {bind(){return {first:async()=>sql.includes('ambassador_grants')?grant:paid}}}}}};
 return {env,queries};
}
test('ambassador alone bypasses paid membership lookup',async()=>{
 const {env,queries}=fixture({account_id:'a'},null);
 assert.equal(effectivePlan(await loadProfessionalMembership('a',env,now),now),'PRO_BUSINESS');
 assert.equal(queries.length,1);
});
test('ordinary accounts require verified admission and unexpired subscription',async()=>{
 const {env,queries}=fixture(null,{plan:'PRO_BUSINESS',paid_until:2000});
 assert.equal(effectivePlan(await loadProfessionalMembership('a',env,now),now),'PRO_BUSINESS');
 assert.match(queries[1],/payhip_admission_payments/);
 assert.match(queries[1],/p.revoked_at IS NULL/);
 assert.match(queries[1],/s.revoked_at IS NULL/);
 for(const paid of [null,{plan:'PRO_BUSINESS',paid_until:now}]){
 const f=fixture(null,paid);
 assert.equal(await loadProfessionalMembership('a',f.env,now),null);
 }
 env.PAID_SUBSCRIPTIONS_VERIFIED='false';
 assert.equal(await loadProfessionalMembership('a',env,now),null);
});
test('emergency stop blocks all memberships',async()=>{
 const {env,queries}=fixture({account_id:'a'},null);
 env.STOP_SERVICE='true';
 assert.equal(await loadProfessionalMembership('a',env,now),null);
 assert.equal(queries.length,0);
});
