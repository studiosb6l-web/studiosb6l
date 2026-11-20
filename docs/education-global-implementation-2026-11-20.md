# STUDIOSB6L — Education & Young Talent implementation brief
Date: 2026-11-20
Status: specification only; do not represent as deployed.

## Priority 1 — Homepage
Inspect actual components generating "Featured artists" and "Musician classifieds" (may be injected by JS). Add a third adjacent "Education & Young Talent" card in the same section, with localized CTA "Register / Explore opportunities", consistent editorial navy/gold aesthetic and professional SVG icons. On desktop three equal cards; on mobile responsive with no horizontal overflow. Preserve current two cards, founder biography, MY VISION and radio/video functions. Replace emoji-based ecosystem grid with coherent SVG iconography, polished typography, restrained gradients, accessible contrast, keyboard focus and translation keys. Do not replace translated text with an image.

## Priority 2 — Secure accounts
Roles: student, teacher, independent instructor, conservatory, music school, academy, university, admin. Separate public profiles and private dashboards; verified email, strong authentication, server-side RBAC, audit log, rate limiting, abuse reporting, account deletion/export. Institution invites and affiliation verification. Students retain their profiles when leaving institutions. No public student profiles without consent; for minors, age-appropriate safeguards, guardian/institution consent where required, restricted contact and no public precise location.

## Priority 3 — Discovery
Structured data for instrument, specialty, lessons, masterclasses, auditions, concerts, country ISO code, city stable identifier, language, online/in-person, availability. Opt-in matching between supply and demand with user-controlled radius, local/national/global filters; avoid using IP location without disclosure or permission. Real postings only, moderation, deduplication, expiry and abuse controls. Notification inbox, transactional emails and opt-in digests with unsubscribe and frequency caps. No unsolicited automated outreach.

## Priority 4 — Global URLs and SEO
Canonical routes such as /education/ and /education/pt/lisboa/ where pt is country code, not UI language. Avoid confusing localization with country; use ?lang or localized UI strategy consistent with existing site. Publish country/city pages only when there is meaningful approved content. Include canonical, hreflang where valid, structured data, sitemap, robots, metadata and tests. No claim of guaranteed indexing.

## Priority 5 — Payments (NOT authorized for live charges until validation)
Free basic student/institution account; optional institution premium EUR 29.90/month, proposed masterclass commission 10%, ticket commission 5%, artist music-sale platform commission EUR 0.49 as previously agreed. Verify provider supports split payments, refunds, KYC, tax, payouts, terms and regional restrictions. Preserve current store and payment integrations. Never switch on real charges for new products without end-to-end tests and legal/operational checks.

## Delivery
First inspect repo and backups; implement in small commits with tests, staged rollout, rollback and production verification. Document changed paths, deployment URLs, evidence, pending blockers and costs. Work may require user authentication or credits. Never claim implementation, emails, indexing or deployment without verification.
