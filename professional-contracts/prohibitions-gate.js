// STUDIOSB6L — central prohibition gate. Pure validation, no network or side effects.
// This module is not enforced until explicitly called by each server-side operation.
const validMoney=x=>Number.isSafeInteger(x)&&x>=0;
export const PROHIBITION_IDS=Object.freeze(Array.from({length:20},(_,i)=>i+1));
export function enforceProhibitions(operation,ctx={}){
 const deny=(rule,reason)=>({allowed:false,rule,reason});
 if(!operation||typeof operation!=='string')return deny(20,'unknown_operation');
 if(ctx.costVerified!==true||ctx.noLossVerified!==true)return deny(1,'financial_verification_missing');
 if(ctx.bot===true&&(ctx.incrementalCostCents!==0||ctx.hardCapVerified!==true))return deny(2,'bot_cost_unverified');
 if(ctx.externalSpend===true&&(ctx.explicitSpendApproval!==true||ctx.hardCapVerified!==true))return deny(17,'unapproved_external_spend');
 if(operation==='charge'){
  if(ctx.priceApproved!==true||ctx.userConsent!==true||!validMoney(ctx.amountCents)||!ctx.currency)return deny(3,'unapproved_charge');
  if(ctx.idempotencyVerified!==true)return deny(4,'duplicate_payment_risk');
  if(ctx.cardDataStored===true)return deny(6,'card_data_storage');
 }
 if(operation==='grant_paid_access'&&ctx.verifiedPayment!==true)return deny(5,'payment_not_verified');
 if(operation==='payment_webhook'&&ctx.validSignature!==true)return deny(7,'invalid_signature');
 if(operation==='publish_profile'&&(ctx.consentVerified!==true||ctx.requiredChecksPassed!==true))return deny(8,'profile_unverified');
 if(operation==='disclose_private_data'&&ctx.legalBasisVerified!==true)return deny(9,'privacy_violation');
 if(operation==='admin_action'&&(ctx.adminAuthorized!==true||ctx.mfaVerified!==true))return deny(10,'unauthorized_admin');
 if(operation==='change_terms'&&ctx.recordedApproval!==true)return deny(11,'terms_unapproved');
 if(operation==='payout'&&(ctx.reconciled!==true||ctx.fraudCleared!==true))return deny(12,'payout_unverified');
 if(operation==='publish_media'&&ctx.rightsVerified!==true)return deny(13,'rights_unverified');
 if(operation==='approve_application'&&ctx.suspicionCleared!==true)return deny(14,'suspicious_application');
 if(operation==='bot_activity'&&ctx.antiManipulationVerified!==true)return deny(15,'manipulation_risk');
 if(operation==='external_ai_data'&&ctx.dataTransferAuthorized!==true)return deny(16,'ai_data_unapproved');
 if(operation==='critical_release'&&(ctx.testsPassed!==true||ctx.reviewApproved!==true||ctx.rollbackReady!==true))return deny(18,'unsafe_release');
 if(operation==='delete_audit'&&ctx.retentionLegalApproval!==true)return deny(19,'audit_retention');
 if(operation==='claim_live'&&ctx.productionEvidenceVerified!==true)return deny(20,'unverified_live_claim');
 return {allowed:true,rule:null,reason:'verified'};
}
