import test from 'node:test';
import assert from 'node:assert/strict';
import {LIMITS,canIssueAmbassadorInvite,effectivePlan,canHost,canAttend,canReserveQuota,sessionPhase,canJoin,cooldownAfter} from './ambassador-session-policy.mjs';
const now=1700000000000;
const pro={disabled:false,paymentVerified:true,paidUntil:now+1000,plan:'PRO'};
const ambassador={disabled:false,ambassadorActive:true};
const metrics=[{used:60,reserved:5,requested:5,freeLimit:100}];
test('only verified MFA owner can invite',()=>{
 const owner={role:'owner',verified:true,mfaVerified:true,expiresAt:Date.now()+60000};
 assert.equal(canIssueAmbassadorInvite(owner),true);
 for(const s of [{...owner,mfaVerified:false},{...owner,role:'artist'},{...owner,disabled:true},{...owner,expiresAt:0},null])assert.equal(canIssueAmbassadorInvite(s),false);
});
test('membership privileges and expiry',()=>{
 assert.equal(effectivePlan(ambassador,now),'PRO_BUSINESS');
 assert.equal(canHost(ambassador,now),true);
 assert.equal(canHost(pro,now),false);
 assert.equal(canAttend(pro,now),true);
 assert.equal(canAttend({...pro,plan:'BASIC'},now),false);
 assert.equal(canAttend({...pro,paidUntil:now},now),false);
 assert.equal(canHost({...ambassador,disabled:true},now),false);
 assert.equal(canHost({...pro,plan:'PRO_BUSINESS'},now),true);
});
test('quota boundaries fail closed',()=>{
 assert.equal(canReserveQuota(metrics),true);
 for(const m of [[],null,[{...metrics[0],requested:6}],[{...metrics[0],used:-1}],[{...metrics[0],freeLimit:NaN}]])assert.equal(canReserveQuota(m),false);
});
test('server time boundaries',()=>{
 assert.equal(sessionPhase(now,now+LIMITS.warningMs-1),'live');
 assert.equal(sessionPhase(now,now+LIMITS.warningMs),'warning');
 assert.equal(sessionPhase(now,now+LIMITS.durationMs),'ended');
 assert.equal(cooldownAfter(now),now+20*3600000);
});
test('admission rejects unauthorized and over-capacity participants',()=>{
 const input={membership:pro,invited:true,activeElsewhere:false,cooldownUntil:now,participantCount:19,startedAt:now,stop:false,metrics,monthlyLessonsUsed:0,weeklyLessonsUsed:0};
 assert.equal(canJoin(input,now),true);
 for(const patch of [{monthlyLessonsUsed:4},{weeklyLessonsUsed:1},{monthlyLessonsUsed:undefined},{participantCount:20},{invited:false},{activeElsewhere:true},{cooldownUntil:now+1},{stop:true},{metrics:[]},{startedAt:now-LIMITS.durationMs},{membership:{...pro,plan:'BASIC'}}])assert.equal(canJoin({...input,...patch},now),false);
});

test('universal sector access and revised limits',()=>{
 assert.equal(LIMITS.durationMs,45*60000);
 assert.equal(LIMITS.warningMs,35*60000);
 assert.equal(LIMITS.monthlyLessons,4);
 assert.equal(LIMITS.weeklyLessons,1);
 for(const sector of ['teacher','musician','singer','composer','producer','audio_engineer','mastering','school','conservatory','promoter','venue','company','future_sector']){
 assert.equal(canHost({...ambassador,sector},now),true);
 assert.equal(canHost({...pro,plan:'PRO_BUSINESS',sector},now),true);
 assert.equal(canAttend({...pro,sector},now),true);
 }
});

test('PRO BUSINESS extended attendance applies across sectors',()=>{
 const input={membership:{...pro,plan:'PRO_BUSINESS'},invited:true,activeElsewhere:false,cooldownUntil:now,participantCount:19,startedAt:now,stop:false,metrics,monthlyLessonsUsed:7,weeklyLessonsUsed:1};
 for(const sector of ['teacher','musician','company','audio_engineer','future_sector']){
 assert.equal(canJoin({...input,membership:{...input.membership,sector}},now),true);
 }
 assert.equal(canJoin({...input,monthlyLessonsUsed:8},now),false);
 assert.equal(canJoin({...input,weeklyLessonsUsed:2},now),false);
 assert.equal(canJoin({...input,membership:pro},now),false);
 assert.equal(canJoin({...input,membership:ambassador},now),true);
 assert.equal(canJoin({...input,metrics:[{used:70,reserved:0,requested:1,freeLimit:100}]},now),false);
});
