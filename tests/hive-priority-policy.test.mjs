import test from 'node:test';
import assert from 'node:assert/strict';
import {planHiveJobs} from '../cloudflare/hive-priority-policy.mjs';
const jobs=[{id:'growth',engine:'GROWTH',units:5,paid:false},{id:'finance',engine:'FINANCE',units:5,paid:false},{id:'search',engine:'GLOBAL_SEARCH',units:5,paid:false}];
const base={jobs,used:60,limit:100,stopped:false,verified:true};
test('critical engines first within shared quota',()=>assert.deepEqual(planHiveJobs(base),['finance','search']));
test('stop and missing verification deny all',()=>{assert.deepEqual(planHiveJobs({...base,stopped:true}),[]);assert.deepEqual(planHiveJobs({...base,verified:false}),[]);});
test('reject paid unknown and duplicate jobs',()=>assert.deepEqual(planHiveJobs({...base,used:0,jobs:[...jobs,jobs[1],{id:'paid',engine:'FINANCE',units:1,paid:true},{id:'unknown',engine:'OTHER',units:1,paid:false}]}),['finance','search','growth']));
test('never consume reserve',()=>assert.deepEqual(planHiveJobs({...base,used:70}),[]));
