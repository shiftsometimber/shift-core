import fs from 'node:fs';

// V11 production promotion: this gate is the release proof for the native
// black, cream and ash-green My Timber surfaces on current main.

const need=(ok,message)=>{if(!ok)throw new Error(message)};
const shell=fs.readFileSync('frontend/member/my-timber-preview.html','utf8');
const grub=fs.readFileSync('frontend/member/member-grub.html','utf8');
const fit=fs.readFileSync('frontend/member/member-fit.html','utf8');
const visual=fs.readFileSync('frontend/member/my-timber-v11.css','utf8');
const worker=fs.readFileSync('worker-entry-v6.js','utf8');
const workerCompact=worker.replace(/"/g,"'").replace(/\s+/g,'');
const config=fs.readFileSync('wrangler.jsonc','utf8');
const extension=fs.readFileSync('frontend/member/my-timber-v11.js','utf8');

need(workerCompact.includes("newURL('/my-timber-preview',request.url)"),'live My Timber route is not serving the governed shell');
for(const marker of [
  'aria-label="Main website navigation"',
  'href="/start-here"',
  'href="/programme"',
  'href="/shift-health"',
  'href="/treatment-centre"',
  'href="/member/dashboard"',
  'href="/about"',
  'href="/ask-timber"',
  'href="/contact"',
  'href="/help"',
  'href="/how-are-you-feeling"',
  'href="/explore-knowledge"',
  'href="/shift-for-work"',
  'href="/shop"',
  'href="/work-with-us"',
  'aria-label="Primary website navigation"',
  'aria-label="My Timber destinations"',
  '<a href="/lounge">THE LOUNGE</a>',
  'member-tap-room',
  'aria-expanded="false"',
  'min-height:44px',
  'name="rememberMe" type="checkbox" checked',
  'Keep me signed in on this device',
  'data.rememberMe=form.elements.rememberMe.checked',
  "params.get('returnTo')"
])need(shell.includes(marker),`My Timber navigation contract missing ${marker}`);
for(const [name,page,current] of [['Today',shell,'/member/dashboard'],['Grub',grub,'/member/grub'],['Fit',fit,'/member/fit']]){
  for(const marker of ['/member/dashboard','/member/grub','/member/fit','/lounge','/my-timber-v11.css','/my-timber-v11.js'])need(page.includes(marker),`${name} V11 contract missing ${marker}`);
  need(page.includes(name==='Today'?'/assets/7B503EDB-D4E0-4F92-B45D-1D5A50AE2597.png?v=42c':'/sst-logo-official.png'),name+' approved logo missing');
  need(page.includes(`href="${current}" aria-current="page"`),`${name} current navigation state missing`);
}
for(const marker of ['background:var(--sst-black)','background:var(--sst-cream)','background:var(--sst-green)','font-family:Arial'])need(visual.includes(marker),`V11 visual contract missing ${marker}`);
for(const marker of ["['/my-timber-v11.css'","['/my-timber-v11.js'","['/sst-logo-official.png'"])need(workerCompact.includes(marker),`V11 Worker asset missing ${marker}`);
need(shell.includes('window.SST_API_BASE=location.origin'),'My Timber auth is not using the same-origin API boundary');
for(const marker of ['shiftsometimber.co.uk/member/dashboard*','shiftsometimber.co.uk/member-login*','shiftsometimber.co.uk/member-register*'])need(config.includes(marker),`live My Timber route missing ${marker}`);
for(const marker of ['shiftsometimber.co.uk/v1/*','www.shiftsometimber.co.uk/v1/*'])need(config.includes(marker),`same-origin member API route missing ${marker}`);
for(const marker of ['shiftsometimber.co.uk/lounge*','www.shiftsometimber.co.uk/lounge*'])need(config.includes(marker),`live Lounge route missing ${marker}`);
need(workerCompact.includes("newURL('/lounge',request.url),301"),'legacy Tap Room route is not permanently redirected to The Lounge');
need(!shell.includes('Isolated My Timber preview'),'live My Timber still presents itself as an isolated preview');
need(!shell.includes('Nothing here touches your live Shift account'),'live My Timber still contains preview-only account copy');
for(const marker of ['.sst-coming-plan b,.sst-coming-plan span{display:block}', '.sst-coming-plan span{margin-top:4px'])need(extension.includes(marker),`coming-off plan sentence spacing missing ${marker}`);
const login=fs.readFileSync('member-login-fastpath-v1.js','utf8');
for(const marker of ['body?.rememberMe===true','Domain=.shiftsometimber.co.uk','Max-Age=','REMEMBER_DAYS=90','STANDARD_HOURS=12'])need(login.includes(marker),`remember-me contract missing ${marker}`);
const state=fs.readFileSync('member-state-fast-v1.js','utf8');
for(const marker of ['matchAll','values.slice(0,4)','for(const raw of candidates)'])need(state.includes(marker),`duplicate-cookie recovery contract missing ${marker}`);
need(workerCompact.includes('authenticateMember(request,env)'),'Lounge page gate is not using duplicate-cookie-safe member authentication');

console.log('My Timber navigation gate: PASS');

// REC-034A: exact approved public navigation, independent of private portal tabs.
const primary=shell.match(/<nav[^>]*class="desktop-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
const drawer=shell.match(/<aside[^>]*id="site-drawer"[^>]*>([\s\S]*?)<\/aside>/)?.[1];
const hrefs=s=>[...String(s||'').matchAll(/<a[^>]*href="([^"]+)"/g)].map(m=>m[1]);
need(JSON.stringify(hrefs(primary))==="[\"/start-here\",\"/programme\",\"/shift-health\",\"/treatment-centre\",\"/member/dashboard\"]",'approved primary order differs');
need(JSON.stringify(hrefs(drawer))==="[\"/start-here\",\"/programme\",\"/shift-health\",\"/treatment-centre\",\"/member/dashboard\",\"/about\",\"/ask-timber\",\"/contact\",\"/help\",\"/how-are-you-feeling\",\"/explore-knowledge\",\"/shift-for-work\",\"/shop\",\"/work-with-us\"]",'approved menu order differs');
need(shell.includes('data-header-style="underline"'),'approved header variant missing');
need(shell.includes('class="drawer-backdrop" hidden'),'menu backdrop missing');
need(shell.includes('data-auth-header-handler'),'canonical menu handler missing');
