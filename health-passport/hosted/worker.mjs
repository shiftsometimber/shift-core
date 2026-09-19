// Hosted integration boundary only. Never imported by the production entry.
// Actual production API router/password/session implementation; separate D1.
import core from '../../worker-entry-v6.js';
import {memberExperienceRoutes} from '../../member-experience/entry.mjs';
import {passportAssets,withPassportPresentation} from '../presentation.mjs';
import snapshot from './generated/snapshot-map.mjs';
const PREFIX='shift-passport-preview-20260919';
const privateHeaders={'Cache-Control':'no-store, must-revalidate','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const safeAPI=new Set(['/v1/auth/turnstile-config','/v1/auth/login','/v1/auth/logout','/v1/me','/v1/profile','/v1/member-state','/v1/consents','/v1/check-ins','/v1/health-mot','/v1/progress','/v1/progress/summary','/v1/journey','/v1/my-journey','/v1/journey/weekly-check-in','/v1/journey/trends','/v1/journey/export','/v1/privacy/export','/v1/privacy/health-tracking','/v1/life-back','/v1/health-passport','/v1/health-passport/records','/v1/health-passport/interest','/v1/shift/context','/v1/shift/daily-plan','/v1/shift/daily-action','/v1/shift/daily-adjust','/v1/shift/daily-feedback','/v1/shift/daily-meal','/v1/shift/today','/v1/shift/today/check-in','/v1/shift/today/grub','/v1/shift/today/move','/v1/shift/today/help','/v1/shift/treatment-context','/v1/fit/activity','/v1/fit/plan','/v1/fit/replace','/v1/fit/feedback','/v1/fit/reminders','/v1/grub/workspace','/v1/grub/search','/v1/grub/plan','/v1/grub/feedback','/v1/grub/replace','/v1/grub/conundrum','/v1/plan/list','/v1/plan/latest','/v1/hydration/today','/v1/hydration/log','/v1/hydration/plan','/v1/events']);
const readOnlyAPI=new Set(['/v1/treatment/orders','/v1/cases','/v1/pharmacy/orders','/v1/commerce/orders','/v1/pen-day']);
const pagePaths=new Set(['/start-here','/member-login','/member/dashboard','/member/settings','/member/grub','/member/fit','/member/check-in']);
const deny=()=>Response.json({error:'isolated_preview_route_unavailable'},{status:404,headers:privateHeaders});
export function hostedGuard(request,env){
 const url=new URL(request.url),expires=Date.parse(env.STAGING_EXPIRES_AT||'');
 return env.SHIFT_ENVIRONMENT==='passport-hosted-20260919'&&url.protocol==='https:'&&new RegExp('^'+PREFIX+'\\.[a-z0-9-]+\\.workers\\.dev$').test(url.hostname)&&Number.isFinite(expires)&&expires>Date.now()&&expires<=Date.now()+49*3600000;
}
export default {async fetch(request,env,ctx){
 if(!hostedGuard(request,env))return deny();
 const url=new URL(request.url),path=url.pathname;
 if(['POST','PATCH','DELETE','PUT'].includes(request.method)&&request.headers.get('Origin')!==url.origin)return Response.json({error:'origin_not_allowed'},{status:403,headers:privateHeaders});
 const safeEnv={...env,PUBLIC_SITE_URL:url.origin,MEMBER_ASSETS:env.MEMBER_ASSETS};
 if(path.startsWith('/v1/')){
  const record=/^\/v1\/health-passport\/records\/[a-zA-Z0-9-]+$/.test(path);
  if(!safeAPI.has(path)&&!record&&!(request.method==='GET'&&readOnlyAPI.has(path)))return deny();
  // Only the production password endpoint issues sessions; no bypass.
  if(request.headers.has('x-shift-commissioning-oidc'))return deny();
  return core.fetch(request,safeEnv,ctx);
 }
 const passport=passportAssets(request,safeEnv);if(passport)return passport;
 const runtime=memberExperienceRoutes(request,safeEnv);if(runtime)return runtime;
 if(!['GET','HEAD'].includes(request.method))return deny();
 let item=snapshot[path+url.search]||snapshot[path];
 // Sole changed browser asset comes from candidate source, not old capture.
 if(path==='/member-my-journey-v2.js')item=null;
 const target=item?item.asset:path;
 const response=await env.MEMBER_ASSETS.fetch(new Request(new URL(target,url),{method:request.method}));
 if(!response.ok)return response;
 const headers=new Headers(response.headers);for(const [k,v]of Object.entries(privateHeaders))headers.set(k,v);
 if(item)headers.set('Content-Type',item.type);
 headers.set('X-Shift-Preview-Source',env.PASSPORT_SOURCE_SHA||'');
 let result=new Response(response.body,{status:response.status,headers});
 if(pagePaths.has(path)&&request.method==='GET'){
  const html=await result.text();
  const notice='<aside data-passport-hosted-preview style="padding:10px 18px;background:#E7E3DA;color:#050505;font:14px Arial">Isolated hosted verification · fictional accounts · no live data or payments</aside>';
  // No script stripping, shell reveal, fake response or session injection.
  const body=html.replace(/(<body\b[^>]*>)/i,'$1'+notice);
  headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; frame-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  headers.delete('Content-Length');headers.delete('ETag');
  result=new Response(body,{headers});
 }
 return withPassportPresentation(request,safeEnv,result);
}};
