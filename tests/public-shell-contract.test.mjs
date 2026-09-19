import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcilePublicDocument,reconcileSitemap,publicHeader,publicDrawer,publicFooter,relatedGuideGroups,withPublicShellContract} from '../public-shell-contract.mjs';
const shell='<html><head><title>Retain me</title><meta name="robots" content="index,follow"></head><body>'+publicHeader+publicDrawer+'<main><h1>Original content</h1><p>Keep this exact paragraph.</p><a href="/medicine-news">News</a><a href="/medicine-news/real-article">Article</a></main>'+publicFooter+'</body></html>';
const hrefs=s=>[...s.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>m[1]);
test('agreed first five drawer links stay in order; remaining labels alphabetical',()=>{const nav=publicDrawer.match(/<nav>(.*?)<\/nav>/s)[1];assert.deepEqual(hrefs(nav).slice(0,5),['/start-here','/programme','/shift-health','/treatment-centre','/member/dashboard']);const labels=[...nav.matchAll(/<a\b[^>]*>(.*?)<\/a>/g)].map(m=>m[1]).slice(5);assert.deepEqual(labels,[...labels].sort((a,b)=>a.localeCompare(b,'en')))});
test('one footer has the retained destinations plus missing key routes, without duplicate anchors',()=>{const links=hrefs(publicFooter);assert.equal(links.length,new Set(links).size);for(const p of ['/treatment-centre','/shop','/shift-newsroom','/good-to-talk','/terms','/privacy','/cookies','/complaints','/contact','/help'])assert(links.includes(p));assert.match(publicFooter,/id="a11yControls"/)});
test('repair is idempotent and preserves article content, titles, H1 and existing article routes',()=>{const s=reconcilePublicDocument(shell,'/programme');assert.equal(reconcilePublicDocument(s,'/programme'),s);assert.match(s,/<h1>Original content<\/h1><p>Keep this exact paragraph\.<\/p>/);assert.match(s,/<title>Retain me<\/title>/);assert.match(s,/href="\/shift-newsroom">News/);assert.match(s,/href="\/medicine-news\/real-article">Article/)});
test('missing public login footer restored after main without rewriting login form',()=>{const html='<html><head></head><body>'+publicHeader+publicDrawer+'<main><form id="real-login">Original auth</form></main></body></html>';const s=reconcilePublicDocument(html,'/member-login');assert.match(s,/<form id="real-login">Original auth<\/form>/);assert(s.indexOf('<footer')>s.indexOf('</main>'));assert.equal((s.match(/class="site-footer"/g)||[]).length,1)});
test('private My Timber, API and HQ responses are outside the public shell repair',()=>{for(const path of ['/member/dashboard','/member/life-back','/v1/profile','/hq/work'])assert.equal(reconcilePublicDocument(shell,path),shell)});
test('all 23 current mental-health orphan guides have contextual homes, not sitemap-only discovery',()=>{const links=Object.values(relatedGuideGroups).flatMap(gs=>gs.flatMap(g=>g.links)),mental=[...new Set(links.filter(a=>a.path.startsWith('/mental-health/')).map(a=>a.path))];assert.equal(mental.length,23);for(const path of ['/mental-health/mental-health-and-weight','/mental-health/myths-men-mental-health','/mental-health/what-will-gp-ask','/mental-health/stopping-antidepressants'])assert(mental.includes(path))});
test('legacy inaccurate pricing/workplace/localStorage methodology are not promoted or deleted',()=>{const links=JSON.stringify(relatedGuideGroups);for(const path of ['/corporate-wellbeing','/pricing-membership','/progress-centre-methodology'])assert(!links.includes('"path":"'+path+'"'))});
test('sitemap removes only the already-noindex workplace page; all mental-health entries survive',()=>{const urls=['/shift-for-work','/mental-health/mental-health-and-weight','/life-back','/shop'];const xml='<urlset>'+urls.map(p=>'<url><loc>https://shiftsometimber.co.uk'+p+'</loc><lastmod>2026-09-17</lastmod></url>').join('')+'</urlset>';const out=reconcileSitemap(xml);assert(!out.includes('/shift-for-work'));for(const p of urls.slice(1))assert(out.includes(p));assert.equal(reconcileSitemap(out),out)});
test('the shared final response strips stale body validators but preserves security headers',async()=>{const req=new Request('https://shiftsometimber.co.uk/shift-health');const out=await withPublicShellContract(req,new Response(shell,{headers:{'Content-Type':'text/html','ETag':'old','Content-Length':'10','Content-Security-Policy':"default-src 'self'"}}));assert.equal(out.headers.get('ETag'),null);assert.equal(out.headers.get('Content-Length'),null);assert.equal(out.headers.get('Content-Security-Policy'),"default-src 'self'");assert((await out.text()).includes('SHIFT Newsroom'))});

test('member login loads the existing auth adapter before any SST_API consumer and only once',()=>{const input='<html><head><script>window.SST_API_BASE=location.origin;</script><script>SST_API.getMe()</script></head><body>'+publicHeader+publicDrawer+'<main><form id="real-login">Login</form></main></body></html>';const once=reconcilePublicDocument(input,'/member-login'),twice=reconcilePublicDocument(once,'/member-login');assert.equal((once.match(/src="\/api-adapter-v33d\.js"/g)||[]).length,1);assert(once.indexOf('src="/api-adapter-v33d.js"')<once.indexOf('SST_API.getMe()'));assert.equal(twice,once)});


test('surgical SEO overrides change only the agreed public title and description fields',()=>{
 const page=(title='Old title',description='Old description')=>'<html><head><title>'+title+'</title><meta name="description" content="'+description+'"></head><body>'+publicHeader+publicDrawer+'<main><h1>Keep body</h1></main>'+publicFooter+'</body></html>';
 const expectedTitles={
  '/ask-timber':"Ask Timber: Men's Health Answers | Shift Some Timber",
  '/advertise-with-us':"Men's Health Advertising UK | Shift Some Timber",
  '/community':"Men's Weight Management Community | Shift Some Timber",
  '/clinical-governance':"Clinical Governance & Decision Support | Shift Some Timber",
  '/contact':"Contact SHIFT: Support & Partnerships | Shift Some Timber"
 };
 for(const [path,title] of Object.entries(expectedTitles)){
  const out=reconcilePublicDocument(page(),path);
  const encodedTitle=title.replaceAll('&','&amp;').replaceAll("'",'&#39;');
  assert(out.includes('<title>'+encodedTitle+'</title>'));
  assert.match(out,/content="Old description"/);
  assert.match(out,/<h1>Keep body<\/h1>/);
 }
 const expectedDescriptions={
  '/decision-centre-methodology':"How SHIFT interprets UK obesity-treatment pathways, NICE tirzepatide criteria, NHS rollout, weight-management support and bariatric referral thresholds.",
  '/downloads-resources':"Download free weight-management checklists for GP visits, medicines, bariatric surgery, provider safety, treatment preparation and long-term maintenance."
 };
 for(const [path,description] of Object.entries(expectedDescriptions)){
  const out=reconcilePublicDocument(page(),path);
  assert(out.includes('content="'+description+'">'));
  assert.match(out,/<title>Old title<\/title>/);
 }
 const about=reconcilePublicDocument(page('Matt O’Brien: My 4½-Stone Weight Loss | Shift Some Timber','Existing about description'),'/about');
 assert(about.includes('<title>Matt O’Brien: My 4½-Stone Weight Loss | Shift Some Timber</title>'));
 assert.match(about,/content="Existing about description"/);
});

test('homepage keeps its ranking title and adds a decorative alt only to the known missing-alt image',()=>{
 const page='<html><head><title>Shift Some Timber | UK Men\'s Weight & Health</title></head><body>'+publicHeader+publicDrawer+'<main><h1>Home</h1><img class="stigma" src="/assets/home-stigma-ruffled-v42p5.webp?v=1"><img src="/assets/other.webp" alt="Existing"></main>'+publicFooter+'</body></html>';
 const once=reconcilePublicDocument(page,'/'),twice=reconcilePublicDocument(once,'/');
 assert(once.includes("<title>Shift Some Timber | UK Men's Weight & Health</title>"));
 assert.match(once,/<img alt="" class="stigma" src="\/assets\/home-stigma-ruffled-v42p5\.webp\?v=1">/);
 assert.equal((once.match(/home-stigma-ruffled-v42p5/g)||[]).length,1);
 assert.equal(twice,once);
});
