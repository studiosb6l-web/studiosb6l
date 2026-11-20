// Internal-only security gates. Never expose rules or risk signals to clients.
// This module is bundled into Workers at deployment; it has no UI.
export function applicationGate({origin,expectedOrigin,dbReady,consent,validFields,bodyBytes}){
 if(origin!==expectedOrigin)return {ok:false,status:403};
 if(!dbReady)return {ok:false,status:503};
 if(!Number.isSafeInteger(bodyBytes)||bodyBytes<0||bodyBytes>12000)return {ok:false,status:413};
 if(consent!==true||validFields!==true)return {ok:false,status:422};
 return {ok:true};
}
export function checkoutGate({origin,expectedOrigin,dbReady,stripeReady,identityVerified,financialControlsVerified}){
 if(origin!==expectedOrigin)return {ok:false,status:403};
 if(!dbReady||!stripeReady||!identityVerified||!financialControlsVerified)return {ok:false,status:503};
 return {ok:true};
}
export function webhookGate({signatureVerified,paymentVerified,identityMapped,idempotencyVerified}){
 if(!signatureVerified)return {ok:false,status:400};
 if(!paymentVerified||!identityMapped||!idempotencyVerified)return {ok:false,status:503};
 return {ok:true};
}
