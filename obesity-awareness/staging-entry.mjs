import {addPillarClient} from './measurement.mjs';
import {withWeightUnderstandingReview,PATH} from './candidate.mjs';
const PRODUCTION='https://shiftsometimber.co.uk';
export const STAGED_PATHS=Object.freeze([PATH,'/weight-loss-support-for-men','/mental-health/mental-health-and-weight','/articles/weight-loss-plateau-men','/mens-weight-management','/articles/evidence-based-weight-loss']);
const headers=()=>({'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'});
const safeFailure=()=>new Response('<!doctype html><html lang="en-GB"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preview unavailable | SHIFT</title></head><body><main><h1>The preview is unavailable</h1><p>No personal record has been changed. You can still choose one meal and a fallback, or write down a question for your GP.</p></main></body></html>',{status:503,headers:headers()});
export function createStagingWorker(upstream=fetch){return {async fetch(request,env={}){
 const path=new URL(request.url).pathname;
 if(env.MALE_OBESITY_PREVIEW_ENABLED!=='true')return new Response('Private staging has not been enabled.',{status:503,headers:headers()});
 if(!['GET','HEAD'].includes(request.method))return new Response('Read-only staging',{status:405,headers:{...headers(),Allow:'GET, HEAD'}});
 if(!STAGED_PATHS.includes(path))return new Response('This route is outside the staged package.',{status:404,headers:headers()});
 const base={async fetch(req){
  const p=new URL(req.url).pathname;
  if(![...STAGED_PATHS,'/programme'].includes(p))return new Response('Not available',{status:404});
  // Fixed public origin, no incoming query, cookies, authorisation or user body.
  const r=await upstream(PRODUCTION+p,{method:req.method,headers:{Accept:'text/html'},redirect:'manual'});
  const h=new Headers(r.headers);h.delete('Set-Cookie');return new Response(r.body,{status:r.status,headers:h});
 }};
 try{
  const r=await withWeightUnderstandingReview(base).fetch(request,{SHIFT_WEIGHT_UNDERSTANDING_REVIEW:'1'});
  if(request.method==='HEAD')return new Response(null,{status:r.status,headers:{...Object.fromEntries(r.headers),...headers()}});
  if(!r.ok||!r.headers.get('Content-Type')?.includes('text/html'))return safeFailure();
  let html=await r.text();
  // Preserve readable page content/styles, disable production scripts and measurement in staging.
  html=html.replace(/<script\b(?![^>]*type=["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<base\b[^>]*>/gi,'');
  const origin=new URL(request.url).origin;
  html=html.replace(/href=(["'])#([^"']*)\1/g,(_,q,a)=>'href="'+origin+path+'#'+a+'"');
  html=html.replace(/href=["']https:\/\/shiftsometimber\.co\.uk(\/[^"']*)["']/g,(all,href)=>STAGED_PATHS.includes(href.split(/[?#]/)[0])?'href="'+origin+href+'"':all);
  html=html.replace(/href=["'](\/[^"']*)["']/g,(all,href)=>{const p=href.split(/[?#]/)[0];return 'href="'+(STAGED_PATHS.includes(p)?origin:PRODUCTION)+href+'"'});
  const menu=`<script data-staging-chrome>const b=document.querySelector('.menu-trigger'),d=document.getElementById('site-drawer');if(b&&d){const close=()=>{d.hidden=true;b.setAttribute('aria-expanded','false');b.focus()};b.onclick=()=>{d.hidden=!d.hidden;b.setAttribute('aria-expanded',String(!d.hidden));if(!d.hidden)d.querySelector('.drawer-close')?.focus()};d.querySelector('.drawer-close')?.addEventListener('click',close);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!d.hidden)close()})}for(const [id,cls]of [['toggleLargeText','staging-large'],['toggleMotion','staging-reduced']])document.getElementById(id)?.addEventListener('click',e=>e.currentTarget.setAttribute('aria-pressed',String(document.body.classList.toggle(cls))));</script>`;
  html=addPillarClient(html);
  html=html.replace('</head>','<base href="'+PRODUCTION+'/"><style>body.staging-large main{font-size:22px!important}body.staging-reduced *{animation:none!important;transition:none!important}</style></head>').replace('</body>',menu+'</body>');
  const h=new Headers(r.headers);for(const k of ['Set-Cookie','Content-Length','Content-Encoding','ETag','Last-Modified'])h.delete(k);for(const [k,v]of Object.entries(headers()))h.set(k,v);
  h.set('Content-Security-Policy',"default-src 'self' https://shiftsometimber.co.uk; script-src 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://shiftsometimber.co.uk; img-src 'self' https://shiftsometimber.co.uk data:; font-src 'self' https://shiftsometimber.co.uk; connect-src 'none'; form-action 'none'; object-src 'none'; base-uri https://shiftsometimber.co.uk; frame-ancestors 'self'");
  return new Response(html,{status:200,headers:h});
 }catch{return request.method==='HEAD'?new Response(null,{status:503,headers:headers()}):safeFailure()}
}}}
export default createStagingWorker();
