// B6L Music Connect matching logic. Pure functions, no notifications sent without consent.
export const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function matchOpportunity(profile, opportunity) {
  if (!profile || !opportunity || opportunity.status !== 'published' || profile.moderation !== 'approved') return null;
  const instruments = Array.isArray(profile.instruments) ? profile.instruments.map(normalize) : [];
  if (!instruments.includes(normalize(opportunity.instrument))) return null;
  if (opportunity.travel_required && !profile.travel_available && normalize(profile.country) !== normalize(opportunity.country)) return null;
  let score = 60;
  if (normalize(profile.country) && normalize(profile.country) === normalize(opportunity.country)) score += 15;
  if (normalize(profile.city) && normalize(profile.city) === normalize(opportunity.city)) score += 15;
  if (Array.isArray(profile.genres) && profile.genres.map(normalize).includes(normalize(opportunity.genre))) score += 10;
  return {score, reason: 'Instrument and location/availability compatibility'};
}
export const PLANS = Object.freeze({
 free: {priceCents:0,currency:'EUR',videoLimit:1,monthlyApplicationLimit:3},
 pro_monthly: {priceCents:499,currency:'EUR',interval:'month',videoLimit:5},
 pro_annual: {priceCents:4990,currency:'EUR',interval:'year',videoLimit:5}
});
