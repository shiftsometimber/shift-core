import {memberExperienceEntry,memberExperienceRoutes} from '../entry.mjs';
import {healthRuntime} from '../health-runtime.mjs';
import {fitRuntime} from '../fit-approved-runtime.mjs';
const prefix='/staging/member-connected/';
const source='/staging/member-source/';
const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://shiftsometimber.co.uk; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'; form-action 'self'"};
const scripts={dashboard:['member-my-timber-problem-v1.js','member-my-journey-v2.js','member-my-journey-checkin-v1.js'],grub:[],fit:['fit.js'],'check-in':['mood.js','assets/member-checkin-experience-v1.js'],settings:[]};
const extra=['api-adapter-v33d.js',...Object.values(scripts).flat()];
const bootstrap="window.SST_API_BASE=location.origin;";
const status=String.raw`const stageNav=()=>document.querySelectorAll('a[href^="/member/"]').forEach(a=>{const u=new URL(a.href);const name=u.pathname.slice(8);if(['dashboard','grub','fit','check-in','settings','life-back'].includes(name))a.href='/staging/member-connected/'+name+u.hash;});stageNav();new MutationObserver(stageNav).observe(document.body,{childList:true,subtree:true});const account=document.querySelector('#connected-account');if(account&&window.SST_API?.getProfile)SST_API.getProfile().then(r=>{account.textContent='Fictional test account: '+r.profile.email}).catch(()=>{account.textContent='Sign in to a fictional account to save. No live account is used.'});`;
export async function connectedMemberRoutes(request,env){
 const u=new URL(request.url),path=u.pathname;
 if(!path.startsWith(prefix))return null;
 if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers});
 const name=path.slice(prefix.length),jsHeaders={...headers,'Content-Type':'text/javascript'};
 if(name==='life-back'){
  const r=memberExperienceRoutes(new Request(new URL('/member/life-back',u)),env);
  let html=(await r.text()).replace('Your private progress','Fictional test account').replace('href="/member/dashboard">Sign in to My Timber','href="/staging/sign-in?next=life-back">Sign in to test account').replace('</body>','<script defer src="'+prefix+'status.js"></script></body>');
  return new Response(html,{headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
 }

 if(name==='bootstrap.js')return new Response(bootstrap,{headers:jsHeaders});
 if(name==='status.js')return new Response(status,{headers:jsHeaders});
 if(name==='health.js')return new Response(healthRuntime,{headers:jsHeaders});
 if(name.startsWith('script/')){
  const asset=name.slice(7);if(!extra.includes(asset))return new Response('Unknown script',{status:404,headers});
  if(asset==='fit.js')return new Response(fitRuntime,{headers:jsHeaders});
  const response=await env.STAGING_ASSETS.fetch(new Request(new URL(source+(asset==='mood.js'?'app.js':asset),u)));
  if(!response.ok)return new Response('Pinned script unavailable',{status:503,headers});
  let js=await response.text();
  if(asset==='member-my-timber-problem-v1.js')js='(()=>{const location={pathname:"/member/dashboard",hash:window.location.hash,href:window.location.href};'+js+'})();';
  if(asset==='member-my-journey-v2.js')js=js.replace('if(!/^\\/member\\/dashboard(?:\\.html)?$/.test(location.pathname))return;', 'if(!/^\\/(?:member|staging\\/member-connected)\\/dashboard(?:\\.html)?$/.test(location.pathname))return;');
  if(asset==='mood.js')js=js.slice(js.indexOf('// Mood — canonical account-backed check-in.'),js.indexOf('// My Why',js.indexOf('// Mood —')));
  return new Response(js,{headers:jsHeaders});
 }
 if(!Object.hasOwn(scripts,name))return new Response('Unknown test screen',{status:404,headers});
 const response=await env.STAGING_ASSETS.fetch(new Request(new URL(source+'member/'+name+'.html',u)));
 if(!response.ok)return new Response('Pinned screen unavailable',{status:503,headers});
 let html=(await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*rel="(?:preconnect|preload|prefetch|manifest)"[^>]*>/gi,'');
 html=html.replace(/(href=")(\/[^"?]+\.css)([^\"]*")/g,(_,a,b,c)=>a+source+b.slice(1)+c);
 if(name==='dashboard')html=html.replace(/<section\b[^>]*id="previewAuth"[^>]*>[\s\S]*?<\/section>/,'').replace(/id="previewMember" hidden/,'id="previewMember"').replace('class="preview-member"','class="preview-member is-ready"').replace(/(id="memberTabs") hidden/,'$1');
 html=html.replace('</head>','<script src="'+prefix+'bootstrap.js"></script><script defer src="'+prefix+'script/api-adapter-v33d.js"></script><script defer src="'+prefix+'health.js"></script>'+scripts[name].map(s=>'<script defer src="'+prefix+'script/'+s+'"></script>').join('')+'<script defer src="'+prefix+'status.js"></script></head>');
 html=html.replace(/(<body\b[^>]*>)/,'$1<aside style="padding:12px;background:#e7e3da;color:#11140f"><strong id="connected-account">Checking fictional account…</strong><p>Real save flows on separate test databases. Use fictional details only.</p><a href="/staging/sign-in">Test sign-in</a> · <a href="'+prefix+'dashboard#journey">Journey</a> · <a href="'+prefix+'grub">Grub</a> · <a href="'+prefix+'life-back">Life Back</a> · <a href="'+prefix+'fit">Fit</a> · <a href="'+prefix+'check-in">Check-in</a> · <a href="'+prefix+'settings">Privacy</a></aside>');
 const enhanced=await memberExperienceEntry(new Request(new URL('/member/'+name,u)),{MEMBER_EXPERIENCE_V1_ENABLED:'true'},new Response(html,{headers:{'Content-Type':'text/html'}}));
 // Enhancement adds the production health script. This stage already loaded the exact same runtime before the tool client.
 html=(await enhanced.text()).replace('<script defer src="/assets/member-experience/health.mjs"></script>','').replace(/href="\/member\/dashboard/g,'href="'+prefix+'dashboard').replace(/href="\/member\/(fit|check-in|settings)/g,'href="'+prefix+'$1');
 return new Response(html,{headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
}
