import test from 'node:test';
import assert from 'node:assert/strict';
import {transmissionBudget,canReserveTransmission,transmissionPeriods} from '../cloudflare/transmission-budget.mjs';
const now=Date.UTC(2026,10,26),pro={disabled:false,paymentVerified:true,paidUntil:now+60000,plan:'PRO'},business={...pro,plan:'PRO_BUSINESS'};
const request={membership:pro,role:'attendee',minutes:45,usedMinutes:135,reservedMinutes:0,monthlySessions:3,weeklySessions:0};
test('monthly minute budgets apply universally, including ambassadors',()=>{
 assert.equal(transmissionBudget(pro,now).minutes,180);
 for(const sector of ['teacher','company','singer','future_sector'])assert.equal(transmissionBudget({...business,sector},now).minutes,360);
 assert.equal(transmissionBudget({disabled:false,ambassadorActive:true},now).minutes,360);
 assert.equal(transmissionBudget({...pro,paidUntil:now},now).minutes,0);
});
test('minutes include reservations and both hosting and attendance',()=>{
 assert.equal(canReserveTransmission(request,now),true);
 for(const patch of [{reservedMinutes:1},{usedMinutes:136},{minutes:46},{minutes:0},{minutes:NaN},{usedMinutes:-1},{monthlySessions:4},{weeklySessions:1},{role:'host'},{role:'unknown'},{reservedMinutes:undefined}])assert.equal(canReserveTransmission({...request,...patch},now),false);
 const extended={...request,membership:business,role:'host',usedMinutes:315,monthlySessions:7,weeklySessions:1};
 assert.equal(canReserveTransmission(extended,now),true);
 for(const patch of [{reservedMinutes:1},{monthlySessions:8},{weeklySessions:2}])assert.equal(canReserveTransmission({...extended,...patch},now),false);
});
test('UTC periods preserve weeks across month and year boundaries',()=>{
 assert.deepEqual(transmissionPeriods(Date.UTC(2027,0,1)),{month:'2027-01',week:'2026-12-28'});
 assert.equal(transmissionPeriods(Date.UTC(2026,10,30)).week,transmissionPeriods(Date.UTC(2026,11,1)).week);
 assert.equal(transmissionPeriods(Date.UTC(2026,10,29)).week,'2026-11-23');
 for(const time of [NaN,-1,Infinity,1.5])assert.throws(()=>transmissionPeriods(time));
});
