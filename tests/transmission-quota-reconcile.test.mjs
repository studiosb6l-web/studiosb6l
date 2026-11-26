import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {reconcileTransmissionQuota} from '../cloudflare/transmission-quota-reconcile.mjs';
test('only confirmed closed rooms release reservations',async()=>{
 const s=new DatabaseSync(':memory:');
 try{
 s.exec('CREATE TABLE accounts(id TEXT PRIMARY KEY)');
 for(const f of ['transmission-schema.sql','transmission-quota-guard.sql'])s.exec(readFileSync(new URL('../cloudflare/'+f,import.meta.url),'utf8'));
 s.exec("INSERT INTO accounts VALUES('a'); INSERT INTO transmission_rooms VALUES('r','provider','a',100,200,NULL); INSERT INTO transmission_quota_metrics VALUES('video',100,10,100,1000); INSERT INTO transmission_quota_reservations(id,transmission_id,metric,units,created_at) VALUES('q','r','video',10,110)");
 const db={prepare(sql){return {bind(...args){return ()=>s.prepare(sql).run(...args)}}},async batch(stmts){s.exec('BEGIN');try{for(const stmt of stmts)stmt();s.exec('COMMIT')}catch(e){s.exec('ROLLBACK');throw e}}};
 const snapshot={metric:'video',freeLimit:100,usedUnits:20,observedAt:300,validUntil:1000,coveredRoomIds:['r']};
 const released=()=>s.prepare("SELECT released_at FROM transmission_quota_reservations WHERE id='q'").get().released_at;
 await reconcileTransmissionQuota(db,snapshot,350);assert.equal(released(),null);
 s.exec("UPDATE transmission_rooms SET closed_at=250 WHERE id='r'");
 await reconcileTransmissionQuota(db,{...snapshot,observedAt:290},350);assert.equal(released(),null);
 await reconcileTransmissionQuota(db,{...snapshot,observedAt:310},350);assert.equal(released(),350);
 await assert.rejects(reconcileTransmissionQuota(db,{...snapshot,validUntil:350},350));
 }finally{s.close()}
});
