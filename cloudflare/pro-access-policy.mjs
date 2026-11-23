import {authorize} from './authorization-policy.mjs';
import {proEntitled} from './pro-entitlements.mjs';

// Use only with a session resolved from trusted backend storage and a subscription
// row loaded by account ID from D1. Never trust client-supplied role or plan.
export function authorizeProCapability({session,subscription,capability,now=Math.floor(Date.now()/1000)}={}){
  if(!authorize(session,'profile:read'))return false;
  if(typeof capability!=='string'||!['opportunities:alerts','opportunities:advanced-search','music:expanded-publishing','profile:advanced-analytics'].includes(capability))return false;
  return proEntitled({accountActive:session.verified===true&&!session.disabled,subscription,now});
}
