const START=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const MAX_PAGES=Number(process.env.SHIFT_SWEEP_MAX||1000);
const CONCURRENCY=Number(process.env.SHIFT_SWEEP_CONCURRENCY||12);
const REQUEST_TIMEOUT_MS=Number(process.env.SHIFT_SWEEP_TIMEOUT_MS||30000);
const NETWORK_RETRY_LIMIT=1;
const NETWORK_RETRY_DELAY_MS=250;
const USER_AGENT='ShiftCommissioning/1.0 (+release-route-sweep)';
const queue=[START+'/',START+'/member-login.html'];
const queued=new Set(queue),visited=new Map(),failures=[],externalHosts=new Map(),discoveredFrom=new Map([[START+'/',null],[START+'/member-login.html',null]]);
const assetExt=/\.(?:css|js|mjs|png|jpe?g|webp|svg|gif|ico|woff2?|ttf|pdf)(?:\?|$)/i;
if(!Number.isInteger(MAX_PAGES)||MAX_PAGES<2)throw new Error('SHIFT_SWEEP_MAX must be an integer of at least 2');
if(!Number.isInteger(CONCURRENCY)||CONCURRENCY<1||CONCURRENCY>32)throw new Error('SHIFT_SWEEP_CONCURRENCY must be an integer from 1 to 32');
if(!Number.isInteger(REQUEST_TIMEOUT_MS)||REQUEST_TIMEOUT_MS<100||REQUEST_TIMEOUT_MS>120000)throw new Error('SHIFT_SWEEP_TIMEOUT_MS must be an integer from 100 to 120000');

function decodeHtmlUrl(raw){
  return String(raw)
    .replace(/&(?:amp|#0*38|#x0*26);/gi,'&')
    .replace(/&(?:quot|#0*34|#x0*22);/gi,'"')
    .replace(/&(?:apos|#0*39|#x0*27);/gi,"'")
    .replace(/&(?:lt|#0*60|#x0*3c);/gi,'<')
    .replace(/&(?:gt|#0*62|#x0*3e);/gi,'>');
}
function normalise(raw,base){
  if(!raw||/^(?:mailto:|tel:|sms:|javascript:|data:|blob:|#)/i.test(raw))return null;
  try{const u=new URL(decodeHtmlUrl(raw),base);u.hash='';if(!/^https?:$/.test(u.protocol))return null;if(u.pathname.startsWith('/cdn-cgi/l/email-protection'))return null;return u}catch{return null}
}
function extract(html,base){
  const scan=String(html||'')
    .replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/gi,'$1</script>')
    .replace(/(<style\b[^>]*>)[\s\S]*?<\/style>/gi,'$1</style>');
  const urls=[];const re=/(?:href|src)\s*=\s*["']([^"']+)["']/gi;let m;
  while((m=re.exec(scan))) {const u=normalise(m[1],base);if(u)urls.push(u)}
  return urls;
}
async function fetchWithRedirectAudit(url){
  let current=url;const chain=[];
  for(let i=0;i<8;i++){
    const r=await fetch(current,{redirect:'manual',signal:AbortSignal.timeout(REQUEST_TIMEOUT_MS),headers:{'User-Agent':USER_AGENT,'Accept':'text/html,application/xhtml+xml,application/json;q=0.8,*/*;q=0.5'}});
    chain.push({url:current,status:r.status});
    if([301,302,303,307,308].includes(r.status)){
      const location=r.headers.get('location');if(!location)return{r,chain,error:'redirect_without_location'};
      const next=normalise(location,current);if(!next)return{r,chain,error:'invalid_redirect_location'};
      if(chain.some(x=>x.url===next.href))return{r,chain,error:'redirect_loop'};
      current=next.href;continue;
    }
    return{r,chain};
  }
  return{r:null,chain,error:'too_many_redirects'};
}
function retryableNetworkFailure(error){return error?.name==='TimeoutError'||error?.name==='AbortError'}
async function fetchWithBoundedNetworkRetry(url){
  for(let attempt=1;attempt<=NETWORK_RETRY_LIMIT+1;attempt++){
    try{return{...await fetchWithRedirectAudit(url),attempts:attempt}}
    catch(error){
      if(!retryableNetworkFailure(error)||attempt>NETWORK_RETRY_LIMIT){error.sweepAttempts=attempt;throw error}
      await new Promise(resolve=>setTimeout(resolve,NETWORK_RETRY_DELAY_MS));
    }
  }
}

async function inspect(url,parent){
  let result;try{result=await fetchWithBoundedNetworkRetry(url)}catch(e){const attempts=e?.sweepAttempts||1;return{url,parent,record:{error:true,attempts},failures:[{url,discoveredFrom:parent,error:`network:${e?.name||'Error'}:${e?.message||e}`,attempts}],children:[],external:[]}}
  const {r,chain,error,attempts}=result;
  if(error||!r)return{url,parent,record:{error:true},failures:[{url,discoveredFrom:parent,error:error||'no_response',chain}],children:[],external:[]};
  const final=chain.at(-1)?.url||url,status=r.status,type=(r.headers.get('content-type')||'').toLowerCase(),localFailures=[];
  const record={status,type,final,chain,discoveredFrom:parent,attempts};
  if(status>=400)return{url,parent,record,failures:[{url,discoveredFrom:parent,status,final}],children:[],external:[]};
  let body='';if(!assetExt.test(final)){try{body=await r.text()}catch(e){localFailures.push({url,discoveredFrom:parent,status,error:`body:${e?.name||'Error'}:${e?.message||e}`})}}
  const children=[],external=[];
  if(type.includes('text/html')){
    const visible=body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/\s+/g,' ').trim();
    if(visible.length<40)localFailures.push({url,discoveredFrom:parent,status,error:'blank_or_near_blank_html',visibleChars:visible.length});
    if(/(?:internal server error|application error|something went wrong\s*$)/i.test(visible)&&visible.length<800)localFailures.push({url,discoveredFrom:parent,status,error:'generic_error_page_detected'});
    const root=new URL(START);for(const child of extract(body,final))(child.host===root.host?children:external).push(child.href);
  }
  return{url,parent,record,failures:localFailures,children,external,final};
}

while(queue.length&&visited.size<MAX_PAGES){
  const batch=[];
  while(queue.length&&batch.length<CONCURRENCY&&visited.size+batch.length<MAX_PAGES){const url=queue.shift();if(!visited.has(url))batch.push({url,parent:discoveredFrom.get(url)||null});}
  if(!batch.length)continue;
  const results=await Promise.all(batch.map(({url,parent})=>inspect(url,parent)));
  for(const result of results){
    visited.set(result.url,result.record);failures.push(...result.failures);
    for(const host of result.external){const name=new URL(host).host;externalHosts.set(name,(externalHosts.get(name)||0)+1);}
    for(const href of result.children)if(!queued.has(href)&&!visited.has(href)&&queued.size<MAX_PAGES*4){queued.add(href);discoveredFrom.set(href,result.final);queue.push(href)}
  }
}

const checked=[...visited.entries()].map(([url,x])=>({url,...x}));
const critical=failures.filter(x=>x.status>=400||x.error);
const report={proof:'M10_WHOLE_ESTATE_ROUTE_SWEEP',start:START,checked:checked.length,htmlPages:checked.filter(x=>x.type?.includes('text/html')).length,failures:critical,externalHosts:[...externalHosts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,30),truncated:queue.length>0,limit:MAX_PAGES,concurrency:CONCURRENCY,requestTimeoutMs:REQUEST_TIMEOUT_MS,networkRetryLimit:NETWORK_RETRY_LIMIT,networkRetryDelayMs:NETWORK_RETRY_DELAY_MS,retriedRoutes:checked.filter(x=>x.attempts>1).length};
console.log(JSON.stringify(report,null,2));
if(critical.length){
  for(const f of critical.slice(0,20)){const detail=[f.status&&`HTTP ${f.status}`,f.error,f.discoveredFrom&&`from=${f.discoveredFrom}`,f.final&&f.final!==f.url&&`final=${f.final}`].filter(Boolean).join(' · ');console.error(`::error title=M10 route sweep::${String(f.url).replace(/%/g,'%25').replace(/\r?\n/g,'%0A')} — ${String(detail).replace(/%/g,'%25').replace(/\r?\n/g,'%0A')}`)}
  process.exit(1);
}
if(!visited.has(START+'/'))throw new Error('Homepage was not swept');
if(checked.length<2)throw new Error('Sweep discovered too little estate surface to be meaningful');
if(report.truncated)throw new Error(`Whole-estate sweep exceeded ${MAX_PAGES} same-origin URLs; increase SHIFT_SWEEP_MAX rather than accepting partial evidence.`);
console.log(`::notice title=M10 production sweep GREEN::${checked.length} same-origin URLs checked · ${report.htmlPages} HTML pages · 0 critical route/asset/blank-page failures · discovery exhausted`);
