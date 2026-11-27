// Call only on a dedicated public page displaying the same verified job details.
export function buildJobPosting(job, now = Date.now()) {
  if (!job || job.kind !== 'employment' || job.verified !== true ||
      job.authorized !== true || job.publicAccess !== true ||
      job.freeApplication !== true || job.applicationAvailable !== true) return null;
  const {title, description, datePosted, validThrough, employer, location} = job;
  const nonempty = v => typeof v === 'string' && v.trim().length > 0;
  if (![title, description, datePosted, validThrough, employer, location?.country, location?.locality].every(nonempty)) return null;
  const posted = Date.parse(datePosted), expiry = Date.parse(validThrough);
  if (!Number.isFinite(posted) || !Number.isFinite(expiry) || posted > now || expiry <= now || expiry <= posted) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title, description, datePosted, validThrough,
    hiringOrganization: {'@type':'Organization', name: employer},
    jobLocation: {'@type':'Place', address: {'@type':'PostalAddress', addressCountry:location.country, addressLocality:location.locality}}
  };
}
// Escape HTML-sensitive characters when embedding JSON-LD in server-generated HTML.
export function serializeJobPosting(schema) {
  return schema ? JSON.stringify(schema).replace(/</g, '\\u003c') : '';
}
