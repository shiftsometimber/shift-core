// Test evidence only: never retain query strings, headers, or response bodies.
export function resourcePath(value) {
  try { const u = new URL(value); return u.origin + u.pathname + u.hash; }
  catch { return '[unavailable]'; }
}
export async function boundedEvidence(label, operation, timeoutMs = 10000) {
  let timer;
  try {
    return await Promise.race([Promise.resolve().then(operation), new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(label + ' exceeded ' + timeoutMs + 'ms')), timeoutMs);
    })]);
  } finally { clearTimeout(timer); }
}
export function attachDiagnostics(page, report, write) {
  report.resources ??= [];
  const record = row => {
    report.resources.push(row);
    if (report.resources.length > 160) report.resources.shift();
    write();
  };
  page.on('requestfailed', request => record({kind:'request_failed', url:resourcePath(request.url()), method:request.method(), resourceType:request.resourceType(), error:request.failure()?.errorText || 'unknown'}));
  page.on('response', response => {
    const request = response.request(), url = resourcePath(response.url());
    if (response.status() >= 400 || /\/v1\/health-passport/.test(url) || request.isNavigationRequest())
      record({kind:'response', status:response.status(), url, method:request.method(), resourceType:request.resourceType()});
  });
  return () => ({page:resourcePath(page.url()), frames:page.frames().map(frame=>resourcePath(frame.url()))});
}
