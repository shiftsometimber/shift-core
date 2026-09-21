import {continuityExposureRuntime} from '../continuity-measurement/client.mjs';
import {withUnitSettings,unitSettingsRuntime} from './unit-settings.mjs';
import {dayGuideMarkup,dayGuideStyles,dayGuideRuntime} from './day-guide.mjs';
import {withSessionState,sessionRuntime} from './session-state.mjs';
import {checkinFollowupRuntime,checkinFollowupStyles} from './checkin-followup-client.mjs';
import {memberNavigation,memberChromeStyles,memberChromeClient,addMemberChrome,lifeBackChrome} from './chrome.mjs';
import {restoreDashboardTools,dashboardToolsRuntime,dashboardToolsStyles} from './dashboard-tools.mjs';
import lifeBackAssets from './life-back-assets.mjs';
import homeArt from './home-art.mjs';
import {homeStyles} from './home-styles.mjs';
import {grubRuntime,upgradeGrubHTML} from './grub-runtime.mjs';
import {memberStyles,journeyStyles} from './styles.mjs';
import {memberClient} from './client.mjs';
import {healthRuntime} from './health-runtime.mjs';
import {fitRuntime} from './fit-approved-runtime.mjs';
import {grubIntelligenceCSS} from './grub-intelligence-client.mjs';
import {withPasswordSettings,passwordSettingsRuntime} from './password-settings.mjs';

export const memberPages = ['dashboard','grub','fit','check-in','saved','settings','plans','ask-timber','my-target','my-why','achievements','timber-circle'];
const pageName = path => path.replace(/\.html$/, '').replace(/^\/member\//, '');
const privateHeaders = {'Cache-Control':'no-store, must-revalidate','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
export function memberExperienceRoutes(request, env) {
  if (env.MEMBER_EXPERIENCE_V1_ENABLED !== 'true') return null;
  const path = new URL(request.url).pathname.replace(/\/+$/, '');
  if (!['GET','HEAD'].includes(request.method)) return null;
  if(path==='/assets/member-experience/session.mjs')return new Response(request.method==='HEAD'?null:sessionRuntime,{headers:{...privateHeaders,'Content-Type':'text/javascript; charset=utf-8'}});
  if(path==='/member/life-changed-preview'||path==='/member/life-changed-preview.html'){
    const modes={'working-late':'working_late','limited-food':'next_three_hours','ten-minutes':'no_time','eating-out':'eating_out','quick-breakfast':'missed_lunch','travel':'plans_cancelled','plans-changed':'plans_cancelled'};
    const mode=modes[new URL(request.url).searchParams.get('mode')]||'next_three_hours';
    return new Response(null,{status:302,headers:{...privateHeaders,Location:'/member/dashboard?reviewChange='+mode+'#today'}});
  }
  if(path==='/assets/member-experience/checkin-followup.mjs')return new Response(request.method==='HEAD'?null:checkinFollowupRuntime,{headers:{...privateHeaders,'Content-Type':'text/javascript; charset=utf-8'}});
  if(path==='/assets/member-experience/checkin-followup.css')return new Response(request.method==='HEAD'?null:checkinFollowupStyles,{headers:{...privateHeaders,'Content-Type':'text/css; charset=utf-8'}});
  if(path==='/assets/member-experience/continuity-exposure.mjs')return new Response(request.method==='HEAD'?null:continuityExposureRuntime,{headers:{...privateHeaders,'Content-Type':'text/javascript; charset=utf-8'}});
  if(path==='/assets/member-experience/unit-settings.mjs')return new Response(request.method==='HEAD'?null:unitSettingsRuntime,{headers:{...privateHeaders,'Content-Type':'text/javascript; charset=utf-8'}});
  if(path==='/assets/member-experience/password-settings.mjs')return new Response(request.method==='HEAD'?null:passwordSettingsRuntime,{headers:{...privateHeaders,'Content-Type':'text/javascript; charset=utf-8'}});
  if(path==='/assets/member-experience/home-art.webp')return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(homeArt.split(',')[1]),c=>c.charCodeAt(0)),{headers:{...privateHeaders,'Content-Type':'image/webp'}});
  if(path==='/assets/member-experience/home.css')return new Response(request.method==='HEAD'?null:homeStyles,{headers:{...privateHeaders,'Content-Type':'text/css; charset=utf-8'}});
  if (['/member/journey','/member/journey.html'].includes(path)) {
    return new Response(null, {status:302,headers:{...privateHeaders,Location:new URL('/member/dashboard#journey',request.url).href}});
  }
  if(path==='/member/life-back'||path==='/member/life-back.html'||path.startsWith('/assets/member-experience/life-back/')){
    const name=path.startsWith('/member/')?'index.html':path.slice('/assets/member-experience/life-back/'.length),a=lifeBackAssets[name];
    if(!a)return new Response('Not found',{status:404,headers:privateHeaders});
    const body=a.base64?Uint8Array.from(atob(a.base64),c=>c.charCodeAt(0)):name==='index.html'?lifeBackChrome(a.body,env.WORK_V1_ENABLED==='true'):a.body;
    return new Response(request.method==='HEAD'?null:body,{headers:{...privateHeaders,'Content-Type':a.type}});
  }
  const asset = {'/assets/member-experience/day-guide.mjs':[dayGuideRuntime,'text/javascript'],'/assets/member-experience/day-guide.css':[dayGuideStyles,'text/css'],'/assets/member-experience/chrome.css':[memberChromeStyles,'text/css'],'/assets/member-experience/chrome.mjs':[memberChromeClient,'text/javascript'],'/assets/member-experience/tools.mjs':[dashboardToolsRuntime,'text/javascript'],'/assets/member-experience/tools.css':[dashboardToolsStyles,'text/css'],'/assets/member-experience/health.mjs':[healthRuntime,'text/javascript'],'/assets/member-experience/fit.mjs':[fitRuntime,'text/javascript'],'/assets/member-experience/grub.mjs':[grubRuntime,'text/javascript'],'/assets/member-experience/v1.css':[memberStyles+journeyStyles,'text/css'],'/assets/member-experience/v1.mjs':[memberClient,'text/javascript']}[path];
  if (!asset) return null;
  return new Response(request.method === 'HEAD' ? null : asset[0]+(path==='/assets/member-experience/v1.css'?grubIntelligenceCSS:''),{headers:{...privateHeaders,'Content-Type':asset[1]+'; charset=utf-8'}});
}

const savedMain = `<section class="member-records"><header class="member-tool-hero"><p class="eyebrow">MY TIMBER · SAVED &amp; RECORDS</p><h1>Pick up where you left off.</h1><p>Your food, your Journey and your recent check-ins. Open the tool where you saved them.</p></header><div class="member-record-grid"><a class="member-record-card" href="/member/grub#saved"><span>01 · FOOD</span><h2>Food worth repeating.</h2><p>Recipes and meals you explicitly saved to your account.</p><strong>Open saved food →</strong></a><a class="member-record-card" href="/member/dashboard#journey"><span>02 · YOUR JOURNEY</span><h2>See your own picture.</h2><p>Your starting point, goals and confirmed weekly records.</p><strong>Open my Journey →</strong></a><a class="member-record-card" href="/member/check-in#history"><span>03 · CHECK-INS</span><h2>Notice your pattern.</h2><p>Return to the check-ins you chose to save.</p><strong>Open recent check-ins →</strong></a><a class="member-record-card" href="/member/settings"><span>04 · YOUR CHOICE</span><h2>Stay in control.</h2><p>Manage optional health tracking and download your account data.</p><strong>Open privacy controls →</strong></a></div></section>`;

// Additive presentation layer: existing form IDs, runtime scripts, authentication
// and API contracts are preserved. Unknown or non-HTML responses pass through.
export async function memberExperienceEntry(request, env, response) {
  const name = pageName(new URL(request.url).pathname);
  if (env.MEMBER_EXPERIENCE_V1_ENABLED !== 'true' || request.method !== 'GET' || !memberPages.includes(name) || !response.ok || !response.headers.get('Content-Type')?.includes('text/html')) return response;
  const original = response.clone();
  let html = await response.text();
  if (!html.includes('</head>') || !html.includes('</body>') || html.includes('data-member-experience="v1"')) return original;
  html = html.replace(/<body([^>]*)>/,(_,attrs)=>'<body'+(attrs.includes('class=')?attrs.replace(/class="([^"]*)"/,'class="$1 sst-member-experience"'):attrs+' class="sst-member-experience"')+' data-member-experience="v1" data-member-page="'+name+'">');
  // Retire the legacy dashboard-only portal bars. The shared My Timber chrome
  // below is the single navigation authority across every authenticated page.
  html = html.replace(/<nav\b[^>]*class="[^"]*\bsst-portal-(?:tabs|tools)\b[^"]*"[^>]*>[\s\S]*?<\/nav>/g,'');
  html = html.replace(/(<nav\b[^>]*class="[^"]*sst-member-tabs[^>]*>)[\s\S]*?<\/nav>/,(_,open)=>open+memberNavigation(env.WORK_V1_ENABLED === 'true')+'</nav>');
  if(!/<nav\b[^>]*class="[^"]*\bsst-member-tabs\b/.test(html))html=html.replace(/<main\b/,'<nav class="sst-member-tabs" aria-label="My Timber">'+memberNavigation(env.WORK_V1_ENABLED==='true')+'</nav><main');
  // Some legacy member templates include stylesheets inside the body. Load the
  // scoped layer after those too, so their sidebars cannot reappear on mobile.
  html = html.replace('</body>','<link rel="stylesheet" href="/assets/member-experience/v1.css"><script type="module" src="/assets/member-experience/v1.mjs"></script></body>');
  if(name === 'dashboard') html = html.replace(/(<input\b[^>]*name="firstName"[^>]*?)\s+value="Matt"/,'$1');
  if(name === 'dashboard')html=restoreDashboardTools(html);
  if(name === 'dashboard')html=html.replace(/\/member-my-timber-problem-v1\.js(?:\?[^"'<>\\\s]*)?/g,'/member-my-timber-problem-v1.js?v=member-walk-20260920').replace(/\/member-my-journey-v2\.js(?:\?[^"'<>\\\s]*)?/g,'/member-my-journey-v2.js?v=member-walk-20260920').replace('</body>','<link rel="stylesheet" href="/assets/member-experience/home.css"></body>');
  if(name === 'grub') html = upgradeGrubHTML(html).replace(/(<main\b[^>]*>)<header>/,'$1<header class="member-tool-hero">');
  if(name === 'fit') html = html.replace('class="sf-hero"','class="sf-hero member-tool-hero"');
  if(['dashboard','fit','check-in','settings'].includes(name)){
    html=html.replace(/<script\b[^>]*src="[^\"]*health-data-consent-v42o\.js[^\"]*"[^>]*><\/script>/g,'');
    html=html.replace('</body>','<script defer src="/assets/member-experience/health.mjs"></script></body>');
  }
  if(name === 'fit') html=html.replace(/src="[^\"]*shift-fit-approved-v1\.js[^\"]*"/g,'src="/assets/member-experience/fit.mjs"');
  if(['fit','check-in'].includes(name))html=html.replace('</main>','<section class="member-journey-handoff"><h2>Keep your story together.</h2><p>Your saved activity and check-ins feed the same My Timber history.</p><a href="/member/life-back#check-in">Log how life feels</a> · <a href="/member/dashboard#today">Back to Today</a></section></main>');
  if(name === 'check-in') html = html.replace(/(<p class="eyebrow">Daily check-in<\/p>[\s\S]*?<p class="checkin-intro">[\s\S]*?<\/p>)/,'<header class="member-tool-hero">$1</header>');
  if(name === 'saved') html = html.replace(/(<main\b[^>]*>)[\s\S]*?<\/main>/,'$1'+savedMain+'</main>');
  if(['dashboard','check-in','grub','fit'].includes(name)){
    const followup='<section id="dailyCheckinFollowup" aria-label="Your saved next-step feedback" hidden></section>';
    if(name==='dashboard')html=html.replace(/(<(?:section|div)\b[^>]*id="panel-today"[^>]*>)/,'$1'+dayGuideMarkup+followup);
    else html=html.replace(/(<main\b[^>]*>)/,'$1'+(name==='check-in'?dayGuideMarkup:'')+followup);
    html=html.replace('</body>','<link rel="stylesheet" href="/assets/member-experience/checkin-followup.css"><script defer src="/assets/member-experience/checkin-followup.mjs"></script></body>');
  }
  if(name==='dashboard')html=html.replace('</body>','<link rel="stylesheet" href="/assets/member-experience/day-guide.css"><script defer src="/assets/member-experience/day-guide.mjs"></script></body>');
  if(name==='dashboard')html=html.replace('</body>','<script defer src="/assets/member-experience/continuity-exposure.mjs"></script></body>');
  if(name === 'settings') html=withUnitSettings(withPasswordSettings(html));
  html=addMemberChrome(html,name);
  if(!env.MEMBER_SESSION_REVIEW_ONLY)html=withSessionState(html);
  const headers = new Headers(response.headers);
  for (const [key,value] of Object.entries(privateHeaders)) headers.set(key,value);
  headers.set('Vary', [...new Set((headers.get('Vary')||'').split(',').map(x=>x.trim()).filter(Boolean).concat('Cookie'))].join(', '));
  for (const key of ['Content-Length','ETag','Last-Modified']) headers.delete(key);
  return new Response(html,{status:response.status,headers});
}
