import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {notifyIncident} from '../cloudflare/incident-alerts.mjs';
function setup(){
 const sql=new DatabaseSync(':memory:');sql.exec(readFileSync('cloudflare/migrations/005_registration_email_budget.sql','utf8'));
 const DB={prepare(q){return {bind(...args){return {run:async()=>({meta:{changes:Number(sql.prepare(q).run(...args).changes)}})}}}},async batch(stmts){sql.exec('BEGIN');try{const r=[];for(const s of stmts)r.push(await s.run());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}}};
 return {sql,env:{DB,INCIDENT_ALERT_TO:'studiosb6l@gmail.com',EMAIL_BUDGET_VERIFIED:'true',EMAIL_FREE_DAILY_QUOTA:'300',EMAIL_DAILY_BUDGET:'20',REGISTRATION_EMAIL_PROVIDER:'brevo',BREVO_API_KEY:'fixture-private-api-key',BREVO_SENDER_VERIFIED:'true',REGISTRATION_FROM_EMAIL:'studiosb6l@gmail.com'}};
}
const now=Date.parse('2026-11-24T12:00:00Z');
test('alerts share registration budget, deduplicate across codes and cap daily delivery',async()=>{
 const {env,sql}=setup();let sent=0;const send=async(u,o)=>{sent++;const b=JSON.parse(o.body);assert.equal(b.to[0].email,'studiosb6l@gmail.com');assert.match(b.textContent,/Não pedir/);assert.equal(o.redirect,'manual');return new Response('{}',{status:201});};
 assert.equal(await notifyIncident(env,'payment-not-activated',send,now),true);
 assert.equal(await notifyIncident(env,'service-error',send,now+1000),false);
 assert.equal(await notifyIncident(env,'service-error',send,now+3600000),true);
 // Conservative reservations include the suppressed attempt in the daily cap.
 assert.equal(await notifyIncident(env,'service-error',send,now+7200000),false);
 assert.equal(sent,2);assert.equal(sql.prepare('SELECT used FROM registration_email_budget WHERE day=?').get('2026-11-24').used,4);
});
test('global exhausted budget never sends; failed delivery never refunds quota',async()=>{
 const {env,sql}=setup();sql.prepare('INSERT INTO registration_email_budget VALUES(?,?)').run('2026-11-24',20);
 assert.equal(await notifyIncident(env,'service-error',()=>{throw Error('must not send');},now),false);
 const a=setup();assert.equal(await notifyIncident(a.env,'service-error',async()=>{throw Error('timeout');},now),false);
 assert.equal(a.sql.prepare('SELECT used FROM registration_email_budget WHERE day=?').get('2026-11-24').used,1);
});
test('preview, STOP, unknown codes and unapproved destination never send or reserve',async()=>{
 for(const patch of [{PREVIEW_ISOLATED:'true'},{STOP_SERVICE:'true'},{INCIDENT_ALERT_TO:'attacker@example.test'},{EMAIL_BUDGET_VERIFIED:'false'}]){
  const {env,sql}=setup();assert.equal(await notifyIncident({...env,...patch},'service-error',()=>{throw Error('must not send');},now),false);assert.equal(sql.prepare('SELECT COUNT(*) n FROM registration_email_budget').get().n,0);
 }
});
