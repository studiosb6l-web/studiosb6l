import test from 'node:test';
import assert from 'node:assert/strict';
import {selectOpportunityDigest} from '../cloudflare/hive-opportunity-digest.mjs';
const p={viewer:{id:'a',notificationConsent:true,categories:['film'],country:'PT'},entitlement:{verified:true,subject:'a',revoked:false,expiresAt:100,plan:'basic'},now:10,stopped:false,records:[{canonicalId:'x',category:'film',country:'PT',sourceVerified:true,sourceAuthorized:true,moderation:'approved',expiresAtMs:100},{canonicalId:'y',category:'film',country:'JP',sourceVerified:true,sourceAuthorized:true,moderation:'approved',expiresAtMs:100}]};
test('basic local, pro international',()=>{assert.deepEqual(selectOpportunityDigest(p),['x']);assert.deepEqual(selectOpportunityDigest({...p,entitlement:{...p.entitlement,plan:'pro'}}),['x','y']);});
test('stop, visitor and consent block private digest',()=>{for(const x of [{stopped:true},{viewer:{...p.viewer,notificationConsent:false}},{entitlement:{...p.entitlement,plan:'visitor'}},{entitlement:{...p.entitlement,subject:'b'}}])assert.deepEqual(selectOpportunityDigest({...p,...x}),[]);});
