// STUDIOSB6L Operations Center: privacy-safe view model, not a deployed dashboard.
import {contractBots} from './bots-registry.js';
export function buildOperationsSnapshot({bots=[],payments=[],contracts=[],alerts=[]}={}){
 const known=new Set(contractBots.map(b=>b.id));
 const cleanBots=bots.filter(b=>known.has(b.id)).map(b=>({id:b.id,status:['active','disabled','error','testing'].includes(b.status)?b.status:'unknown'}));
 const count=(items,status)=>items.filter(x=>x.status===status).length;
 return Object.freeze({
  bots:{defined:contractBots.length,reported:cleanBots.length,active:count(cleanBots,'active'),errors:count(cleanBots,'error')},
  payments:{total:payments.length,failed:count(payments,'failed'),pending:count(payments,'pending')},
  contracts:{total:contracts.length,pending:count(contracts,'pending'),signed:count(contracts,'signed')},
  alerts:{critical:alerts.filter(x=>x.severity==='critical').length,open:alerts.filter(x=>x.status==='open').length},
  source:'provided-data',live:false
 });
}
// Authorization MUST be enforced by server before fetching data; this helper is not access control.
export function assertAdminRole(session){if(!session||session.authenticated!==true||session.role!=='admin'||session.mfaVerified!==true)throw new Error('ADMIN_MFA_REQUIRED');return true;}
