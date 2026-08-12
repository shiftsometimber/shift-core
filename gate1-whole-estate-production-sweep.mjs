const START=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const MAX_PAGES=Number(process.env.SHIFT_SWEEP_MAX||250);
const USER_AGENT='ShiftCommissioning/1.0 (+release-route-sweep)';
const queue=[START+'/',START+'/member-login.html'];
const queued=new Set(queue),visited=new Map(),failures=[],externalHosts=new Map();
const assetExt=/\.(?:css|js|mjs|png|jpe?g|webp|svg|gif|ico|woff2?|ttf|pdf)(?:\?|$)/i;

function normalise(raw,base){
  if(!raw||/^(?:mailto:|tel:|sms:|javascript:|data:|blob:|#)/i.test(raw))return null;
  try{const u=new URL(raw,base);u.hash='';if(!/^https?:$/.test(u.protocol))return null;if(u.pathname.startsWith('/cdn-cgi/l/email-protection'))return null;return u}catch{return null}
}
function extract(html,base){
  const urls=[];const re=/(?:href|src)\s*=\s*["']([^"']+)["']/gi;let m;
  while((m=re.exec(html))) {const u=normalise(m[1],base);if(u)urls.push(u)}
  return urls;
}
async function fetchWithRedirectAudit(url){
  let current=url;const chain=[];
  for(let i=0;i<8;i++){
    const r=await fetch(current,{redirect:'manual',headers:{'User-Agent':USER_AGENT,'Accept':'text/html,application/xhtml+xml,application/json;q=0.8,*/*;q=0.5'}});
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

while(queue.length&&visited.size<MAX_PAGES){
  const url=queue.shift();if(visited.has(url))continue;
  let result;try{result=await fetchWithRedirectAudit(url)}catch(e){failures.push({url,error:`network:${e?.message||e}`});visited.set(url,{error:true});continue}
  const {r,chain,error}=result;
  if(error||!r){failures.push({url,error:error||'no_response',chain});visited.set(url,{error:true});continue}
  const final=chain.at(-1)?.url||url,status=r.status,type=(r.headers.get('content-type')||'').toLowerCase();
  const record={status,type,final,chain};visited.set(url,record);
  if(status>=400){failures.push({url,status,final});continue}
  let body='';if(!assetExt.test(final)){try{body=await r.text()}catch{}}
  if(type.includes('text/html')){
    const visible=body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/\s+/g,' ').trim();
    if(visible.length<40)failures.push({url,status,error:'blank_or_near_blank_html',visibleChars:visible.length});
    if(/(?:internal server error|application error|something went wrong\s*$)/i.test(visible)&&visible.length<800)failures.push({url,status,error:'generic_error_page_detected'});
    for(const child of extract(body,final)){
      const root=new URL(START);
      if(child.host===root.host){const href=child.href;if(!queued.has(href)&&!visited.has(href)&&queued.size<MAX_PAGES*4){queued.add(href);queue.push(href)}}
      else externalHosts.set(child.host,(externalHosts.get(child.host)||0)+1);
    }
  }
}

const checked=[...visited.entries()].map(([url,x])=>({url,...x}));
const critical=failures.filter(x=>x.status>=400||x.error);
const report={proof:'M10_WHOLE_ESTATE_ROUTE_SWEEP',start:START,checked:checked.length,htmlPages:checked.filter(x=>x.type?.includes('text/html')).length,failures:critical,externalHosts:[...externalHosts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,30),truncated:queue.length>0,limit:MAX_PAGES};
console.log(JSON.stringify(report,null,2));
if(critical.length){
  for(const f of critical.slice(0,20)){const detail=[f.status&&`HTTP ${f.status}`,f.error,f.final&&f.final!==f.url&&`final=${f.final}`].filter(Boolean).join(' · ');console.error(`::error title=M10 route sweep::${String(f.url).replace(/%/g,'%25').replace(/\r?\n/g,'%0A')} — ${String(detail).replace(/%/g,'%25').replace(/\r?\n/g,'%0A')}`)}
  process.exit(1);
}
if(!visited.has(START+'/'))throw new Error('Homepage was not swept');
if(checked.length<2)throw new Error('Sweep discovered too little estate surface to be meaningful');
console.log(`::notice title=M10 production sweep GREEN::${checked.length} same-origin URLs checked · ${report.htmlPages} HTML pages · 0 critical route/asset/blank-page failures${report.truncated?' · discovery hit configured limit':''}`);
