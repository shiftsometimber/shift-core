const CSS=String.raw`
[data-connected-health]{box-sizing:border-box;max-width:920px;margin:16px auto 24px;padding:20px;border:1px solid #707762;border-radius:14px;background:#050505;color:#e7e3da;font:inherit;line-height:1.5;overflow-wrap:anywhere}
[data-connected-health] *{box-sizing:border-box}[data-connected-health] [hidden]{display:none!important}[data-connected-health] :is(h2,h3,p,label,small,summary,span,dt,dd){color:#e7e3da!important}
[data-connected-health] h2{font-size:22px;margin:0 0 10px}[data-connected-health] h3{font-size:18px;margin:20px 0 6px}[data-connected-health] summary{cursor:pointer;min-height:44px;font-weight:700}
[data-connected-health] :is(button,a){display:inline-flex;align-items:center;min-height:44px;max-width:100%;padding:10px 14px;margin:4px 8px 4px 0;border:1px solid #707762;border-radius:8px;background:#e7e3da!important;color:#050505!important;font:inherit;font-weight:700;text-decoration:none;cursor:pointer}
[data-connected-health] button:disabled{opacity:.6;cursor:not-allowed}[data-connected-health] :is(button,a,summary):focus-visible{outline:3px solid #e7e3da;outline-offset:3px}
[data-connected-health] dl{display:grid;grid-template-columns:minmax(90px,1fr) 2fr;gap:8px 12px}[data-connected-health] dd{margin:0}[data-connected-health] [role=status]{min-height:24px}
@media(max-width:650px){[data-connected-health]{margin:12px;padding:16px}[data-connected-health] dl{grid-template-columns:1fr}[data-connected-health] dd{margin-bottom:8px}}
`;
export function healthClient(){
 'use strict';
 if(window.__timberConnectedHealth)return;window.__timberConnectedHealth=true;
 const root=document.querySelector('[data-connected-health]');if(!root)return;
 const labels={apple_health:'Apple Health',health_connect:'Health Connect'};
 const metrics={weight:'Weight',height:'Height',steps:'Steps',sleep:'Recorded sleep'};
 const panel=root.querySelector('[data-health-content]'),status=root.querySelector('[role=status]');
 let account=null,busy=false,serial=0;
 const el=(tag,text,parent)=>{const x=document.createElement(tag);x.textContent=text;if(parent)parent.append(x);return x};
 function clear(){panel.replaceChildren();account=null;}
 async function api(suffix='',body){
  const response=await fetch('/v1/connected-health'+suffix,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',redirect:'error',headers:{Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
  const data=await response.json();if(!response.ok||data.ok!==true)throw Object.assign(new Error('request_failed'),{status:response.status});return data;
 }
 function formatted(r){
  if(!r)return 'No shared reading';
  const value=r.metric==='sleep'?`${Math.floor(r.value/3600)} h ${Math.round((r.value%3600)/60)} min`:r.metric==='steps'?Math.round(r.value).toLocaleString('en-GB'):r.value.toLocaleString('en-GB',{maximumFractionDigits:1})+' '+r.unit;
  const date=new Date(r.endAt).toLocaleDateString('en-GB');
  const kind=r.metric==='sleep'?(r.basis==='asleep_union'?' · recorded asleep time':' · sleep session duration'):'';
  return `${value} · ${date}${r.stale?' · older reading':''}${kind}${r.metric==='height'&&!r.confirmedAt?' · suggestion':''}`;
 }
 function action(title,suffix,c,extra={},question){
  const button=el('button',title,panel);button.type='button';
  button.addEventListener('click',async()=>{
   if(busy||account===null)return;if(question&&!window.confirm(question))return;
   busy=true;button.disabled=true;const expected=account,generation=serial;
   try{await api(suffix,{expectedAccountId:expected,provider:c.provider,connectionId:c.connectionId,revision:c.revision,...extra});if(generation!==serial||document.visibilityState==='hidden')return;status.textContent='Saved. Updating your connected-health settings.';await load();}
   catch{clear();status.textContent='This change was not confirmed. Reload settings before trying again.';}
   finally{busy=false;button.disabled=false;}
  });return button;
 }
 async function load(){
  const id=++serial;if(document.visibilityState==='hidden'){clear();return;}status.textContent='Checking connected-health settings…';clear();
  try{
   const data=await api();if(id!==serial)return;
   if(!Number.isSafeInteger(data.accountId)||!Array.isArray(data.connections))throw Error('invalid_account');account=data.accountId;
   el('p','These imports are optional wellbeing records, not verified clinical measurements. Your manual answers and treatment details stay unchanged.',panel);
   const native=/MyTimberConnectedHealthPreview\/1/.test(navigator.userAgent);
   if(native){const a=el('a','Connect or sync health data',panel);a.href='/member/connected-health';}
   else el('p','Connect Apple Health or Health Connect inside the My Timber mobile app. Imported records then appear in this same account on the website and PWA. Manual entry remains available.',panel);
   if(!data.connections.length)el('p','No health connection has been set up for this account.',panel);
   for(const c of data.connections){
    if(!labels[c.provider])continue;
    el('h3',labels[c.provider],panel);
    el('p',c.syncEnabled?'Import consent is on. Phone permissions control which readings are available.':'Sync is stopped.',panel);
    if(!c.personalisationEnabled)el('p','Imported readings are excluded from personalised progress.',panel);
    el('p',c.lastImportAt?'Last imported: '+new Date(c.lastImportAt).toLocaleString('en-GB'):'No successful import recorded.',panel);
    const dl=el('dl','',panel);
    for(const [metric,name]of Object.entries(metrics)){el('dt',name,dl);el('dd',formatted(data.latest?.[c.provider]?.[metric]),dl);}
    if(c.syncEnabled)action('Stop syncing','/stop',c);
    if(c.personalisationEnabled)action('Stop using these readings','/withdraw',c,{},'Stop syncing and exclude these imports from personalised progress? Copies remain available in your export until you delete them.');
    action('Delete imported data','/delete',c,{},'Delete this provider’s imported measurements from My Timber and stop syncing? This does not delete data from Apple Health or Health Connect.');
    const height=data.latest?.[c.provider]?.height;
    if(height&&!height.confirmedAt){
     const button=el('button','Confirm this height reading',panel);button.type='button';
     button.onclick=async()=>{if(busy)return;busy=true;button.disabled=true;try{await api('/height/confirm',{expectedAccountId:account,provider:c.provider,externalId:height.externalId,expectedValue:height.value,expectedStartAt:height.startAt,confirm:true});await load();}catch{clear();status.textContent='Height confirmation was not saved. Reload and check the reading.';}finally{busy=false;button.disabled=false;}};
    }
   }
   status.textContent='Settings loaded. Manage phone permissions in Apple Health or Health Connect. Disconnecting does not erase previously imported copies.';
  }catch(e){if(id!==serial)return;clear();status.textContent=e.status===401?'Sign in to view your connected health data.':e.status===404?'Connected health is not enabled in this build. Your existing My Timber account is unchanged.':'Connected health could not be loaded. No missing reading has been treated as zero.';}
 }
 window.addEventListener('pagehide',()=>{serial++;clear();status.textContent='';});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){serial++;clear();}else if(!busy)load();});
 window.addEventListener('pageshow',()=>{if(!busy)load();});
 load();
}
export const client='('+healthClient.toString()+')();';
export const card='<section data-connected-health aria-labelledby="connectedHealthHeading"><h2 id="connectedHealthHeading">Connected health data</h2><div data-health-content></div><p role="status" aria-live="polite">Checking connected-health settings…</p><noscript><p>JavaScript is needed to manage this optional connection. Your manual My Timber entries still work.</p></noscript></section>';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
export function connectedHealthAsset(request,env){
 if(env.CONNECTED_HEALTH_V1_ENABLED!=='true')return null;
 const path=new URL(request.url).pathname,asset={'/assets/connected-health-v1.js':[client,'application/javascript'],'/assets/connected-health-v1.css':[CSS,'text/css']}[path];
 if(!asset)return null;if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405,headers});
 return new Response(request.method==='HEAD'?null:asset[0],{headers:{...headers,'Content-Type':asset[1]+'; charset=utf-8'}});
}
export async function withConnectedHealth(request,response,env){
 if(env.CONNECTED_HEALTH_V1_ENABLED!=='true'||request.method!=='GET'||!response.ok||!response.headers.get('Content-Type')?.includes('text/html')||!/^\/member\/(?:settings|progress)(?:\.html)?\/?$/.test(new URL(request.url).pathname))return response;
 const html=await response.text();if(html.includes('data-connected-health')||!html.includes('</head>')||!html.includes('</main>')||!html.includes('</body>'))return new Response(html,response);
 const next=html.replace('</head>','<link rel="stylesheet" href="/assets/connected-health-v1.css"></head>').replace('</main>',card+'</main>').replace('</body>','<script defer src="/assets/connected-health-v1.js"></script></body>');
 const h=new Headers(response.headers);for(const k of ['Content-Length','ETag','Last-Modified'])h.delete(k);h.set('Cache-Control','private, no-store');
 return new Response(next,{status:response.status,headers:h});
}
