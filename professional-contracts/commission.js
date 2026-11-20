// STUDIOSB6L Professional Contracts — financial calculation, amounts in integer cents.
// No payment is executed by this module.
export function calculateContractSplit(grossCents) {
  if (!Number.isSafeInteger(grossCents) || grossCents < 0) throw new RangeError("grossCents must be a nonnegative safe integer");
  const feeCents = Math.floor((grossCents * 5 + 50) / 100);
  return { grossCents, platformFeeCents: feeCents, professionalBeforeOtherFeesCents: grossCents - feeCents, commissionBasisPoints: 500 };
}
export function validateContractDraft(draft) {
  const required = ["clientId", "professionalId", "serviceType", "deliverables", "currency", "grossCents", "jurisdiction", "rightsTerms", "cancellationTerms"];
  const missing = required.filter(key => draft?.[key] === undefined || draft?.[key] === null || draft?.[key] === "");
  if (draft?.currency !== "EUR") missing.push("supported EUR currency");
  if (!Number.isSafeInteger(draft?.grossCents) || draft.grossCents <= 0) missing.push("positive grossCents");
  if (draft?.clientId && draft.clientId === draft?.professionalId) missing.push("distinct parties");
  return { valid: missing.length === 0, missing };
}
