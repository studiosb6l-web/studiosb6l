import test from 'node:test';
import assert from 'node:assert/strict';
import {reserveHiveQuota} from '../cloudflare/hive-quota-reservation.mjs';
test('missing database and invalid requests fail closed',async()=>{assert.equal(await reserveHiveQuota(null),false);assert.equal(await reserveHiveQuota({}, {service:'D1',windowId:'x',units:0,now:1}),false);});
test('only confirmed atomic update permits reservation',async()=>{for(const changes of [0,1]){const db={prepare:sql=>{assert.match(sql,/hive_operational_control/);return {bind:()=>({run:async()=>({meta:{changes}})})};}};assert.equal(await reserveHiveQuota(db,{service:'D1',windowId:'x',units:1,now:1}),changes===1);}});
