import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {transmissionUsage} from '../cloudflare/transmission-usage.mjs';
test('host time is counted once and attendance is bounded by expiry and period',async()=>{
 const sqlite=new DatabaseSync(':memory:');
 try{
 sqlite.exec(`CREATE TABLE transmission_rooms(id TEXT,host_account_id TEXT,started_at INTEGER,expires_at INTEGER,closed_at INTEGER);
 CREATE TABLE transmission_attendance(transmission_id TEXT,account_id TEXT,joined_at INTEGER,left_at INTEGER);
 INSERT INTO transmission_rooms VALUES('r','host',0,2700000,NULL);
 INSERT INTO transmission_attendance VALUES('r','host',0,NULL),('r','student',600000,NULL);`);
 const db={prepare(sql){return {bind(...args){return {first:async()=>sqlite.prepare(sql).get(...args)}}}}};
 assert.equal((await transmissionUsage(db,'host',0,3600000,360)).usedMinutes,45);
 assert.equal((await transmissionUsage(db,'student',0,3600000,180)).usedMinutes,35);
 assert.equal((await transmissionUsage(db,'host',1800000,3600000,360)).usedMinutes,15);
 sqlite.exec("UPDATE transmission_rooms SET closed_at=1200000");
 assert.equal((await transmissionUsage(db,'student',0,3600000,180)).usedMinutes,10);
 }finally{sqlite.close();}
});
