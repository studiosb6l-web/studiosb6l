// Exact owned origins only; never derive trust from the request Host or Origin.
export const ACCOUNT_ORIGIN='https://studiosb6l-artists-api.studiosb6l.workers.dev';
export const WEBSITE_ORIGIN='https://www.studiosb6l.com';
export const trustedAuthOrigin=origin=>origin===WEBSITE_ORIGIN||origin===ACCOUNT_ORIGIN;
export const authResponseOrigin=request=>trustedAuthOrigin(request.headers.get('Origin'))?request.headers.get('Origin'):WEBSITE_ORIGIN;
