// Approved target prices in integer EUR cents. Not a checkout or entitlement authority.
// Existing customer contracts must be preserved during migration.
export const APPROVED_PLANS=Object.freeze({
 VISITOR:Object.freeze({oneTime:0}),
 BASIC:Object.freeze({oneTime:299}),
 PRO:Object.freeze({monthly:499,annual:4990}),
 PRO_PLUS:Object.freeze({monthly:999,annual:9990}),
 PRO_BUSINESS:Object.freeze({monthly:1499,annual:14990})
});
export const CURRENCY='EUR';
