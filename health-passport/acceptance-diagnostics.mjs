// Test evidence only: never retain query strings, headers, credentials or bodies.
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
  const started = performance.now(), pending = new Map();
  const record = row => {
    report.resources.push({atMs:Math.round(performance.now()-started),...row});
    if (report.resources.length > 240) report.resources.shift();
    report.pendingResources = [...pending.values()];
    write();
  };
  const describe = request => ({url:resourcePath(request.url()),method:request.method(),resourceType:request.resourceType()});
  page.on('request', request => {
    pending.set(request, {...describe(request),startedMs:Math.round(performance.now()-started)});
    if(request.isNavigationRequest())record({kind:'navigation_requested',...describe(request)});
  });
  page.on('requestfinished', request => {pending.delete(request);});
  page.on('requestfailed', request => {
    pending.delete(request);
    record({kind:'request_failed',...describe(request),error:request.failure()?.errorText || 'unknown'});
  });
  page.on('response', response => {
    const request = response.request(), url = resourcePath(response.url());
    if (response.status() >= 400 || /\/v1\/health-passport/.test(url) || request.isNavigationRequest())
      record({kind:'response',status:response.status(),...describe(request)});
  });
  page.on('framenavigated',frame=>record({kind:'frame_committed',mainFrame:frame===page.mainFrame(),url:resourcePath(frame.url())}));
  page.on('domcontentloaded',()=>record({kind:'domcontentloaded',url:resourcePath(page.url())}));
  page.on('load',()=>record({kind:'load',url:resourcePath(page.url())}));
  return () => ({page:resourcePath(page.url()),frames:page.frames().map(frame=>resourcePath(frame.url())),pending:[...pending.values()]});
}
