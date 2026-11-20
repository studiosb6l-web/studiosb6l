// Policy gate: a final professional contract may only be issued after verified
// payment through the STUDIOSB6L platform. This module does not process payments.
// The caller MUST obtain payment from a trusted, server-side, signature-verified
// processor webhook or processor API, never browser-provided payment status.
export function canIssueContract({contract, payment}) {
  if (!contract || !payment) return false;
  if (!contract.id || payment.contractId !== contract.id) return false;
  if (contract.status !== 'accepted') return false;
  if (payment.provider !== 'stripe_connect') return false;
  if (payment.platform !== 'STUDIOSB6L') return false;
  if (payment.verifiedByServer !== true || payment.webhookSignatureValid !== true) return false;
  if (payment.status !== 'succeeded' || payment.refunded === true || payment.disputed === true) return false;
  if (!Number.isSafeInteger(payment.amountCents) || payment.amountCents !== contract.grossCents) return false;
  if (payment.currency !== contract.currency) return false;
  if (!payment.processorPaymentId) return false;
  return true;
}
export function assertMayIssueContract(input) {
  if (!canIssueContract(input)) throw new Error('CONTRACT_ISSUANCE_REQUIRES_VERIFIED_PLATFORM_PAYMENT');
  return true;
}
