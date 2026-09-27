// Public readiness is deliberately not an operational dashboard.
export async function publicHealthResponse(request, env) {
  let ok = false;
  try { ok = (await env.DB.prepare('SELECT 1 AS ready').first())?.ready === 1; } catch {}
  return new Response(request.method === 'HEAD' ? null : JSON.stringify({ok}), {
    status: ok ? 200 : 503,
    headers: {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'},
  });
}
