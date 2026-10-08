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

const diagnosticPath=value=>{
 if(value==='about:blank')return value;
 try{
  const u=new URL(value);
  if(!['shiftsometimber.co.uk','api.shiftsometimber.co.uk','test'].includes(u.hostname))return '[external]';
  const safe=/^\/(?:member\/(?:dashboard|fit|grub|life-back|journey)|v1\/(?:me|auth\/(?:login|logout|register)|health-passport(?:\/records)?|fit\/plan)|(?:assets|frontend\/member)\/[a-zA-Z0-9_./-]+|[a-zA-Z0-9_-]+\.(?:js|mjs|css))$/;
  return u.origin+(safe.test(u.pathname)?u.pathname:'/[other-path]');
 }catch{return '[unavailable]';}
};
export function navigationLogSummary(report){
 const number=value=>Number.isFinite(value)?Math.max(0,Math.round(value)):undefined;
 const resource=row=>({
  url:diagnosticPath(row.url),
  ...(typeof row.kind==='string'&&['response','request_failed','navigation_requested','frame_committed','domcontentloaded','load'].includes(row.kind)?{kind:row.kind}:{}),
  ...(['GET','POST','DELETE','HEAD','OPTIONS'].includes(row.method)?{method:row.method}:{}),
  ...(['document','script','stylesheet','image','font','fetch','xhr'].includes(row.resourceType)?{resourceType:row.resourceType}:{}),
  ...(Number.isInteger(row.status)&&row.status>=100&&row.status<=599?{status:row.status}:{}),
  ...(number(row.atMs)!==undefined?{atMs:number(row.atMs)}:{}),
  ...(number(row.startedMs)!==undefined?{startedMs:number(row.startedMs)}:{}),
  ...(typeof row.error==='string'&&/^net::ERR_[A-Z_]+$/.test(row.error)?{error:row.error}:{})
 });
 const nav=report.navigation||{},dom=report.reloadFailureState||{};
 return {kind:'synthetic_navigation_diagnostics',
  navigation:{page:diagnosticPath(nav.page),frames:(nav.frames||[]).slice(0,12).map(diagnosticPath),pending:(nav.pending||[]).slice(-20).map(resource)},
  resources:(report.resources||[]).slice(-40).map(resource),
  document:{...(dom.documentUnavailable===true?{unavailable:true}:{}),
   ...(['loading','interactive','complete'].includes(dom.readyState)?{readyState:dom.readyState}:{}),
   ...(typeof dom.memberReady==='boolean'?{memberReady:dom.memberReady}:{}),
   ...(typeof dom.authHidden==='boolean'?{authHidden:dom.authHidden}:{}),
   ...(typeof dom.serviceWorker==='boolean'?{serviceWorker:dom.serviceWorker}:{})}
 };
}
