import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
test('quota guard rejects stale, missing and excessive reservations',()=>{
 const db=new DatabaseSync(':memory:');
 try{
 db.exec('CREATE TABLE accounts(id TEXT PRIMARY KEY)');
 for(const file of ['transmission-schema.sql','transmission-quota-guard.sql'])db.exec(readFileSync(new URL('../cloudflare/'+file,import.meta.url),'utf8'));
 db.exec("INSERT INTO accounts VALUES('a'); INSERT INTO transmission_rooms VALUES('r','provider','a',100,2700100,NULL); INSERT INTO transmission_quota_metrics VALUES('video',100,60,100,200)");
 const reserve=db.prepare('INSERT INTO transmission_quota_reservations(id,transmission_id,metric,units,created_at) VALUES(?,?,?,?,?)');
 assert.throws(()=>reserve.run('x','r','missing',1,150));
 assert.throws(()=>reserve.run('x','r','video',11,150));
 assert.throws(()=>reserve.run('x','r','video',1,200));
 reserve.run('ok','r','video',10,150);
 assert.equal(db.prepare('SELECT SUM(units) AS total FROM transmission_quota_reservations').get().total,10);
 }finally{db.close();}
});
