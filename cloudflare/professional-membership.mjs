import {loadActiveAmbassadorGrant} from './ambassador-entitlement-store.mjs';
import {loadPaidMembership} from './paid-subscription-store.mjs';
export async function loadProfessionalMembership(accountId,env,now=Date.now()){
 if(!env?.DB||env.STOP_SERVICE==='true'||env.PREVIEW_ISOLATED==='true')return null;
 if(await loadActiveAmbassadorGrant(env,accountId))return {disabled:false,ambassadorActive:true};
 return loadPaidMembership(accountId,env,now);
}
