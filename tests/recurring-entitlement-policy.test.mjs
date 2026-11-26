import test from 'node:test';
import assert from 'node:assert/strict';
import {recurringEntitlement} from '../cloudflare/recurring-entitlement-policy.mjs';
test('verified renewal, cancellation and stale events',()=>{
 const mapping={p:{plan:'PRO',interval:'month'}};
 const s={subscriptionId:'s',accountId:'a',observedAt:900,status:'active',invoicePaid:true,admissionVerified:true,paidUntil:2000,price:{id:'p',active:true,currency:'eur',type:'recurring',unit_amount:499,recurring:{interval:'month',interval_count:1}}};
 const active=recurringEntitlement(s,mapping,null,1000);
 assert.equal(active.plan,'PRO');
 const canceled=recurringEntitlement({...s,observedAt:950,status:'canceled'},mapping,active,1000);
 assert.equal(canceled.revokedAt,950);
 assert.equal(recurringEntitlement(s,mapping,canceled,1000),null);
 assert.equal(recurringEntitlement({...s,observedAt:950},mapping,canceled,1000),null);
 for(const patch of [{invoicePaid:false},{admissionVerified:false},{paidUntil:1000},{observedAt:1001}])assert.equal(recurringEntitlement({...s,...patch},mapping,null,1000),null);
 assert.equal(recurringEntitlement({...s,accountId:'b',observedAt:990},mapping,canceled,1000),null);
});
