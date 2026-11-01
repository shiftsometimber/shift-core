import {firstSixWeeks,firstSixWeeksURL} from './first-six-weeks-content.mjs';
import {firstSixWeeksClient} from './first-six-weeks-client.mjs';
import {firstSixWeeksStyles} from './first-six-weeks-styles.mjs';
import {firstSixWeeksPhoto} from './first-six-weeks-photo.mjs';

export const firstSixWeeksRuntime='('+firstSixWeeksClient.toString()+')('+JSON.stringify(firstSixWeeks)+','+JSON.stringify(firstSixWeeksURL)+');';
const base='/assets/member-experience/programme-first-six-weeks';
export function firstSixWeeksRoutes(request,env){
  if(env.MEMBER_EXPERIENCE_V1_ENABLED!=='true'||!['GET','HEAD'].includes(request.method))return null;
  const path=new URL(request.url).pathname;
  const asset=path===base+'.mjs'?[firstSixWeeksRuntime,'text/javascript']:path===base+'.css'?[firstSixWeeksStyles,'text/css']:path===base+'.webp'?[Uint8Array.from(atob(firstSixWeeksPhoto),c=>c.charCodeAt(0)),'image/webp']:null;
  if(!asset)return null;
  return new Response(request.method==='HEAD'?null:asset[0],{headers:{'Content-Type':asset[1]+(asset[1].startsWith('text/')?'; charset=utf-8':''),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
export async function withFirstSixWeeks(request,response,env){
  const u=new URL(request.url);
  if(env.MEMBER_EXPERIENCE_V1_ENABLED!=='true'||request.method!=='GET'||!['/member/dashboard','/member/dashboard.html','/member/life-back/journey'].includes(u.pathname)||!response.ok||!response.headers.get('Content-Type')?.includes('text/html'))return response;
  const original=response.clone();let html=await response.text();
  if(!html.includes('</body>')||html.includes('data-mt-first-six-weeks'))return original;
  const programme=u.pathname==='/member/life-back/journey'&&u.searchParams.get('view')==='first-six-weeks';
  if(programme){
    const existing=/<script\b[^>]*\bsrc=["']\/assets\/member-experience\/programme-journey\.mjs["'][^>]*><\/script>/;
    if(!existing.test(html)||!html.includes('id="timberJourney"'))return original;
    html=html.replace(existing,'').replace('<title>Your Journey · My Timber</title>','<title>Your first six weeks · My Timber</title>');
  }
  html=html.replace('</body>','<link data-mt-first-six-weeks="20261101" rel="stylesheet" href="'+base+'.css"><script defer src="'+base+'.mjs"></script></body>');
  const headers=new Headers(response.headers);for(const h of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(h);
  headers.set('Cache-Control','no-store, private');headers.set('X-My-Timber-First-Six-Weeks','20261101');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}
// An additive wrapper around the CURRENT serving service. Original exports,
// bindings, schedules, source modules, records and every other handler survive.
export function wrapFirstSixWeeks(original){return {...original,async fetch(request,env,ctx){
  const asset=firstSixWeeksRoutes(request,env);if(asset)return asset;
  return withFirstSixWeeks(request,await original.fetch(request,env,ctx),env);
}};}
