// Read-only evaluation: no automatic changes, spending or external calls.
export function evaluateEngine({observed,successful,failed,costCents,verified}={}) {
 const values=[observed,successful,failed,costCents];
 if(verified!==true || !values.every(v=>Number.isSafeInteger(v)&&v>=0) || successful>observed || failed>observed-successful || observed===0)
 return {status:'insufficient_data',successRate:null,costPerSuccessCents:null,recommendation:'verify_telemetry'};
 const successRate=successful/observed;
 return {status:'measured',successRate,costPerSuccessCents:successful?costCents/successful:null,recommendation:failed>0?'review_failures':successful===0?'review_effectiveness':'observe'};
}
