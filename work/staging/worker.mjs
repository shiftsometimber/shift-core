// Separate staging entry; never imported by the production entry.
import core from '../../worker-entry-v6.js';
import {memberReviewRoutes} from '../../member-experience/staging/routes.mjs';
import {layoutResponse} from './layout.mjs';
import {workHTML} from '../screen.mjs';
const privateHeaders={'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','Content-Type':'text/html; charset=utf-8'};
const isHost=h=>h.startsWith('shift-core-work-staging.')&&h.endsWith('.workers.dev');
export default {async fetch(request,env,ctx){
 const u=new URL(request.url),p=u.pathname;
 if(env.SHIFT_ENVIRONMENT!=='work-staging-20260912'||!isHost(u.hostname)||!env.STAGING_EXPIRES_AT||!Number.isFinite(Date.parse(env.STAGING_EXPIRES_AT))||Date.now()>=Date.parse(env.STAGING_EXPIRES_AT))return new Response('Staging is unavailable.',{status:404});
 const memberReview=await memberReviewRoutes(request,env);if(memberReview)return memberReview;
 const layout=layoutResponse(request);if(layout)return layout;
 const banner='<aside class="work-panel"><strong>Fictional staging environment</strong><p>Separate test accounts and databases. No real employees, health information, email delivery, payment or test ordering. Your fictional invitation code can be loaded below after signing in. This environment expires automatically.</p><a href="/staging/sign-in">Test sign-in</a> · <a href="/staging/register">Create a fictional test account</a> <button type="button" id="stage-logout">Sign out of test account</button></aside>';
 if(request.method==='GET'&&['/','/member/dashboard','/staging/sign-in','/staging/register'].includes(p)){
  const register=p==='/staging/register',title=register?'Create a fictional test account':'Sign in to your test account';
  const main='<main class="work">'+banner+'<h1>'+title+'</h1><p>Use an address ending in @example.invalid and a test-only password. These credentials are separate from your live My Timber account.</p><form id="stage-auth" data-register="'+register+'"><label>Test email<input type="email" name="email" autocomplete="username" required placeholder="reviewer@example.invalid"></label><label>Test password<input type="password" name="password" autocomplete="'+(register?'new-password':'current-password')+'" minlength="10" required></label><button type="submit">'+(register?'Create test account':'Sign in')+'</button></form><p id="stage-status" role="status"></p></main>';
  return new Response(workHTML('member').replace(/<main\b.*?<\/main>/s,main).replace('/assets/work/work.mjs','/staging/login.mjs'),{headers:privateHeaders});
 }
 if(request.method==='GET'&&['/staging/login.mjs','/staging/invitation.txt'].includes(p))return env.STAGING_ASSETS.fetch(request);
 if(request.method==='GET'&&['/assets/home-hero-men-v32o.jpg','/styles.css','/assets/member-shell-v6.css','/assets/shift-recovery-v6.css','/assets/7B503EDB-D4E0-4F92-B45D-1D5A50AE2597.png'].includes(p))return env.STAGING_ASSETS.fetch(request);
 const allowed=['/v1/profile','/v1/me','/v1/consents','/v1/check-ins','/v1/health-mot','/v1/progress','/v1/journey','/v1/journey/weekly-check-in','/v1/journey/trends','/v1/journey/export','/v1/privacy/health-tracking','/v1/privacy/export','/v1/fit/activity','/v1/fit/plan','/v1/fit/replace','/v1/fit/feedback','/v1/plan/list','/v1/grub/workspace','/v1/grub/search','/v1/member-state','/member/work','/employer/work','/hq/work','/assets/work/work.css','/assets/work/work.mjs','/v1/work','/v1/work/join','/v1/work/review','/v1/work/withdraw','/v1/work/export','/v1/work/testing','/v1/employer/work','/v1/hq/work','/v1/auth/login','/v1/auth/register','/v1/auth/logout','/v1/hq/auth/login','/v1/hq/auth/logout'];
 if(!allowed.includes(p))return new Response('Only workplace verification routes are available here.',{status:404});
 if(['POST','PATCH','DELETE'].includes(request.method)){
  if(request.headers.get('Origin')!==u.origin)return new Response('Same-origin requests only.',{status:403});
  if(p==='/v1/auth/register'){
   const b=await request.clone().json().catch(()=>null);
   if(!b||b.firstName!=='Fictional reviewer'||!/^[-a-zA-Z0-9._]+@example\.invalid$/.test(b.email??'')||Object.keys(b).some(k=>!['email','password','firstName'].includes(k)))return Response.json({error:'Use fictional @example.invalid test details only.'},{status:400});
   const count=await env.DB.prepare('SELECT COUNT(*) n FROM users WHERE first_name="Fictional reviewer"').first();if(count.n>=20)return Response.json({error:'Staging account limit reached.'},{status:409});
  }
 }
 const response=await core.fetch(request,env,ctx);
 if(response.headers.get('Content-Type')?.includes('text/html')&&response.ok){
  const body=await response.text(),h=new Headers(response.headers);h.delete('Content-Length');h.delete('ETag');h.set('Cache-Control','no-store');
  return new Response(body.replace('<main class="work">','<main class="work">'+banner).replace('</head>','<script type="module" src="/staging/login.mjs"></script></head>'),{status:response.status,headers:h});
 }
 return response;
}};
