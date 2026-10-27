import {stripMentalHealthTicker} from '../ticker.mjs';
import {page,styles,client,dashboardClient} from './content.mjs';
import {supportApi,json,forgetSupport,exportSupport} from './api.mjs';
import {authenticateMember} from '../../member-state-fast-v1.js';
import {runSupportReminders} from './reminders.mjs';
import {sendSupportPush} from './push.mjs';
const version='20261023-followthrough-v1';
const dashboardPaths=new Set(['/member/dashboard','/member/dashboard/','/member/dashboard.html']);
const hubPaths=new Set(['/mens-mental-health','/mens-mental-health/','/mens-mental-health.html']);
const privacyPaths=new Set(['/v1/privacy/export','/v1/privacy/health-tracking','/v1/privacy/account','/v1/consents']);
const standard={'Cache-Control':'private, no-store, must-revalidate','Vary':'Cookie','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow','Referrer-Policy':'no-referrer','X-Shift-Support-Followthrough':version};
const cleanHeaders=response=>{const h=new Headers(response.headers);for(const k of ['Content-Length','Content-Encoding','ETag','Last-Modified'])h.delete(k);for(const [k,v]of Object.entries(standard))h.set(k,v);return h};
export function enhanceDashboard(html){
 if(html.includes('data-support-followthrough'))return html;
 if(!/<main\b[\s\S]*?<\/main>/i.test(html))throw Error('member_main_missing');
 const card='<section id="supportFollowThrough" data-support-followthrough hidden aria-labelledby="supportCardTitle" style="margin:20px 0;padding:22px;border:1px solid #707762;border-radius:8px;background:#E7E3DA;color:#050505;text-align:left"><h2 id="supportCardTitle" style="color:#050505;font-size:24px">My next step</h2><p data-support-saved></p><p>Keep track of a support step you choose, at your pace.</p><a href="/member/support" style="color:#050505;font-weight:700;text-decoration:underline">Open my saved step and reminders</a><p style="font-size:13px">Private and optional. This is not clinical monitoring.</p></section>';
 return html.replace(/<\/main>/i,card+'</main>').replace('</body>','<script src="/member/support/dashboard.js" defer></script></body>');
}
export function enhanceHub(html){
 html=stripMentalHealthTicker(html);
 const marker='<details id="find-professional-help">';if(!html.includes(marker)||html.includes('data-support-followthrough'))return html;
 return html.replace(marker,'<p data-support-followthrough><a href="/member/support">Save a next step and optional reminder in My Timber</a>. Your appointment notes stay on this page and are not copied into your account.</p>'+marker);
}
export default {
 async fetch(request,env){
  const u=new URL(request.url),path=u.pathname,read=['GET','HEAD'].includes(request.method);
  const target=u.hostname.endsWith('.workers.dev')?new Request(new URL(path+u.search,'https://shiftsometimber.co.uk'),request):request;
  if(path.startsWith('/v1/my-timber-support'))return supportApi(request,env);
  if(path==='/member/support'||path==='/member/support/'){
   if(!read)return json({error:'method_not_allowed'},405);
   return new Response(request.method==='HEAD'?null:page,{headers:{...standard,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'; form-action 'self'"}});
  }
  const asset={'/member/support/style.css':[styles,'text/css'],'/member/support/client.js':[client,'application/javascript'],'/member/support/dashboard.js':[dashboardClient,'application/javascript']}[path];
  if(asset)return new Response(request.method==='HEAD'?null:asset[0],{status:read?200:405,headers:{...standard,'Content-Type':asset[1]+'; charset=utf-8'}});
  if(privacyPaths.has(path)){
   const mutate=request.method!=='GET'&&request.method!=='OPTIONS';let auth,input;
   if(mutate){const allowed=['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://api.shiftsometimber.co.uk',u.origin];if(!allowed.includes(request.headers.get('Origin')))return json({error:'origin_not_allowed'},403);auth=await authenticateMember(request,env);if(auth.response)return json({error:'authentication_required'},401);if(path==='/v1/consents')input=await request.clone().json().catch(()=>null);}
   const response=await env.CORE.fetch(target);if(!response.ok||!mutate)return response;
   try{
    if(path==='/v1/privacy/export'&&request.method==='POST'){const data=await response.json();data.goodToTalkFollowThrough=await exportSupport(env.DB,auth.userId);return new Response(JSON.stringify(data),{status:response.status,headers:cleanHeaders(response)});}
    if(request.method==='DELETE'&&['/v1/privacy/health-tracking','/v1/privacy/account'].includes(path)||path==='/v1/consents'&&request.method==='POST'&&['my_shift_health_tracking','good_to_talk_followthrough'].includes(input?.type??input?.consentType)&&input?.granted===false){
     await forgetSupport(env.DB,auth.userId);const body=await response.json();body.goodToTalkFollowThroughCleared=true;return new Response(JSON.stringify(body),{status:response.status,headers:cleanHeaders(response)});
    }
    return response;
   }catch{return json({error:'support_privacy_operation_incomplete',message:'The support data part of this privacy request could not be completed. Please retry.'},503);}
  }
  const binding=path.startsWith('/member/dashboard')?env.MEMBER:path.startsWith('/mens-mental-health')?env.PATHWAY:env.CORE;
  const response=await binding.fetch(target);
  if(request.method!=='GET'||!response.ok||!(response.headers.get('Content-Type')||'').includes('text/html')||(!dashboardPaths.has(path)&&!hubPaths.has(path)))return response;
  const original=await response.text();let html;try{html=dashboardPaths.has(path)?enhanceDashboard(original):enhanceHub(original);}catch{return new Response(original,response);}
  const headers=cleanHeaders(response);if(hubPaths.has(path)){const robots=response.headers.get('X-Robots-Tag');if(robots)headers.set('X-Robots-Tag',robots);else headers.delete('X-Robots-Tag');}
  return new Response(html,{status:response.status,headers});
 },
 async scheduled(controller,env,ctx){const run=runSupportReminders(env,new Date(controller.scheduledTime||Date.now()),sendSupportPush);if(ctx?.waitUntil)ctx.waitUntil(run);else await run;}
};
