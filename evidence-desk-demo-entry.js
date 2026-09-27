export default {
  async fetch(request, env) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Staging demo is read-only', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    headers.set('Cache-Control', 'no-store');
    headers.set('X-Shift-Environment', 'non-production-staging');
    headers.set('X-Shift-Publication', 'disabled');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
};
