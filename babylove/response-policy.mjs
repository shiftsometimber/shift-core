// Same public policy delivered by the Pages estate (verified 21 September 2026).
// Imported article responses do not pass through Pages, so apply it centrally.
export const PUBLIC_HEADERS = Object.freeze({
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self' mailto:; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com; connect-src 'self' https://challenges.cloudflare.com https://api.shiftsometimber.co.uk https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://cloudflareinsights.com https://*.cloudflareinsights.com https://www.thesportsdb.com; img-src 'self' data: blob: https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src 'self' https://challenges.cloudflare.com https://www.googletagmanager.com; worker-src 'self' blob:; manifest-src 'self'; media-src 'self'; upgrade-insecure-requests",
  'Permissions-Policy': 'accelerometer=(), autoplay=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), publickey-credentials-get=(), usb=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
});

export function withArticleResponsePolicy(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(PUBLIC_HEADERS)) headers.set(name, value);
  return new Response(response.body, {status: response.status, statusText: response.statusText, headers});
}
