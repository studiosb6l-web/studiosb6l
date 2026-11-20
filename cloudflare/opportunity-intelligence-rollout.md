# STUDIOSB6L Opportunity Intelligence — deployment boundaries
The keyword classifier and CI tests are repository code, not a deployed crawler, autonomous agent or Cloudflare Worker.
Use it to classify public music-sector opportunities from verified, authorized APIs/RSS feeds or submissions voluntarily provided to STUDIOSB6L.
Never scrape restricted sites, collect private profiles or contact details, bypass robots.txt, or mass-message people.
Do not automatically discover or execute third-party bots. Treat feeds and AI agents as untrusted sources; require explicit integration allowlists, authentication and security review.
Pipeline: authorized source -> provenance, deduplication, keyword classifier -> human/verified-source moderation -> D1 storage -> consent-based matching -> publication/notifications.
Suggested categories: employment, collaboration, performance, licensing, education and promotion. Include multilingual terms and geolocation filters only when explicitly provided by the opportunity.
Current status: classifier and automated tests added. No external feed, database migration, live matching, search acceleration or outreach is activated by this change.
