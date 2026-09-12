import {grubRuntime,upgradeGrubHTML} from './grub-runtime.mjs';
import {memberStyles} from './styles.mjs';
import {memberClient} from './client.mjs';
import {healthRuntime} from './health-runtime.mjs';
import {fitRuntime} from './fit-runtime.mjs';

export const memberPages = ['dashboard','grub','fit','check-in','saved','settings','plans','ask-timber','my-target','my-why','achievements','timber-circle'];
const pageName = path => path.replace(/\.html$/, '').replace(/^\/member\//, '');
const privateHeaders = {'Cache-Control':'no-store, must-revalidate','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
export function memberExperienceRoutes(request, env) {
  if (env.MEMBER_EXPERIENCE_V1_ENABLED !== 'true') return null;
  const path = new URL(request.url).pathname.replace(/\/+$/, '');
  if (!['GET','HEAD'].includes(request.method)) return null;
  if (['/member/journey','/member/journey.html'].includes(path)) {
    return new Response(null, {status:302,headers:{...privateHeaders,Location:new URL('/member/dashboard#journey',request.url).href}});
  }
  const asset = {'/assets/member-experience/health.mjs':[healthRuntime,'text/javascript'],'/assets/member-experience/fit.mjs':[fitRuntime,'text/javascript'],'/assets/member-experience/grub.mjs':[grubRuntime,'text/javascript'],'/assets/member-experience/v1.css':[memberStyles,'text/css'],'/assets/member-experience/v1.mjs':[memberClient,'text/javascript']}[path];
  if (!asset) return null;
  return new Response(request.method === 'HEAD' ? null : asset[0],{headers:{...privateHeaders,'Content-Type':asset[1]+'; charset=utf-8'}});
}

function navigation(work) {
  const links = [['/member/dashboard#today','Today'],['/member/dashboard#journey','Journey'],['/member/grub','Grub'],['/member/fit','Fit'],['/member/check-in','Check-in']];
  return '<span class="member-nav-label">MY TIMBER</span><div class="member-nav-tools">'+links.map(([href,label])=>`<a href="${href}">${label}</a>`).join('')+'</div><details class="member-nav-more"><summary>More</summary><div><a href="/member/saved">Saved &amp; records</a><a href="/member/settings">Settings &amp; privacy</a><a href="/member/ask-timber">Ask Timber</a>'+(work?'<a href="/member/work">My workplace programme</a>':'')+'</div></details>';
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
  html = html.replace(/(<nav\b[^>]*class="[^"]*sst-member-tabs[^>]*>)[\s\S]*?<\/nav>/,(_,open)=>open+navigation(env.WORK_V1_ENABLED === 'true')+'</nav>');
  // Some legacy member templates include stylesheets inside the body. Load the
  // scoped layer after those too, so their sidebars cannot reappear on mobile.
  html = html.replace('</body>','<link rel="stylesheet" href="/assets/member-experience/v1.css"><script type="module" src="/assets/member-experience/v1.mjs"></script></body>');
  if(name === 'dashboard') html = html.replace(/(<input\b[^>]*name="firstName"[^>]*?)\s+value="Matt"/,'$1');
  if(name === 'grub') html = upgradeGrubHTML(html).replace(/(<main\b[^>]*>)<header>/,'$1<header class="member-tool-hero">');
  if(name === 'fit') html = html.replace('class="sf-hero"','class="sf-hero member-tool-hero"');
  if(['dashboard','fit','check-in','settings'].includes(name)){
    html=html.replace(/<script\b[^>]*src="[^\"]*health-data-consent-v42o\.js[^\"]*"[^>]*><\/script>/g,'');
    html=html.replace('</body>','<script defer src="/assets/member-experience/health.mjs"></script></body>');
  }
  if(name === 'fit') html=html.replace(/src="[^\"]*shift-fit-approved-v1\.js[^\"]*"/g,'src="/assets/member-experience/fit.mjs"');
  if(name === 'check-in') html = html.replace(/(<p class="eyebrow">Daily check-in<\/p>[\s\S]*?<p class="checkin-intro">[\s\S]*?<\/p>)/,'<header class="member-tool-hero">$1</header>');
  if(name === 'saved') html = html.replace(/(<main\b[^>]*>)[\s\S]*?<\/main>/,'$1'+savedMain+'</main>');
  const headers = new Headers(response.headers);
  for (const [key,value] of Object.entries(privateHeaders)) headers.set(key,value);
  headers.set('Vary', [...new Set((headers.get('Vary')||'').split(',').map(x=>x.trim()).filter(Boolean).concat('Cookie'))].join(', '));
  for (const key of ['Content-Length','ETag','Last-Modified']) headers.delete(key);
  return new Response(html,{status:response.status,headers});
}
