import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {renderShiftHealthDocument,healthSlugs} from '../shift-health-public.mjs';
import {renderWatchDocument} from '../medicines-watch/page.mjs';
import {publicHealthResponse} from '../public-health-v1.js';
import {continuityInterestRoutes} from '../continuity-interest-v1.js';
import worker from '../worker-entry-v6.js';
import {legacyAuthorityRedirects,reconcilePublicDocument,reconcileSitemap} from '../public-shell-contract.mjs';

const shell=`<!doctype html><html><head><title>Programme</title><link href="https://shiftsometimber.co.uk/programme" rel="canonical"/><meta content="old" name="description"><link rel="stylesheet" href="/assets/shift-recovery-v6.css"><link rel="stylesheet" href="/assets/header-navigation-v2.css"><script defer src="/consent-v4a.js"></script></head><body class="one-shift programme-page"><a class="skip-link" href="#main-content">Skip to main content</a><header><a href="/programme" aria-current="page">Programme</a><a href="/shift-health">SHIFT Health</a></header><nav id="site-drawer"><a href="/shift-health">SHIFT Health</a></nav><main id="main-content"><h1>Programme</h1></main><footer>Retained footer</footer></body></html>`;
test('all eleven Health pages have complete server-visible content and retained canonical shell',()=>{
  assert.equal(healthSlugs.length,10);
  for(const slug of ['',...healthSlugs]){
    const html=renderShiftHealthDocument(shell,slug),main=html.match(/<main\b[\s\S]*?<\/main>/)[0];
    const words=main.replace(/<[^>]*>/g,' ').split(/\s+/).filter(Boolean).length;
    assert.ok(words>(slug?500:150),`${slug}: ${words} words`);
    for(const marker of ['consent-v4a.js','shift-recovery-v6.css','header-navigation-v2.css','skip-link','site-drawer','Retained footer'])assert.ok(html.includes(marker),marker);
    assert.equal((html.match(/<h1\b/g)||[]).length,1);
    assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
    assert.ok(html.includes('href="https://shiftsometimber.co.uk/shift-health'+(slug?'/'+slug:'')+'"'));
    assert.doesNotMatch(html,/complete interactive route loads below|shift-health-catalogue-v1\.js/);
    assert.match(html,/<body class="one-shift shift-health-public">/);
    if(slug){assert.match(main,/No stock available today/);assert.match(main,/<details\b/);assert.match(main,/id="evidence"/)}
  }
  assert.equal(renderShiftHealthDocument(shell,'invented-route'),null);
});
test('superseded authority routes permanently consolidate without broad public rewrites',async()=>{
  const cases={
    '/health-mot':'/shift-health/health-mot',
    '/health-mot.html':'/shift-health/health-mot',
    '/programme-benefits':'/programme',
    '/pricing-membership':'/treatment-centre',
    '/founding-members':'/programme',
    '/comparisons/surgery/gastric-band-vs-sleeve.html':'/comparisons/surgery/gastric-band-vs-sleeve',
  };
  for(const [from,to] of Object.entries(cases))for(const method of ['GET','HEAD']){
    const r=await worker.fetch(new Request('https://shiftsometimber.co.uk'+from+'?source=legacy',{method}),{},{});
    assert.equal(r.status,301,from);
    assert.equal(r.headers.get('location'),'https://shiftsometimber.co.uk'+to+'?source=legacy',from);
  }
  const untouched=legacyAuthorityRedirects['/comparisons/surgery/gastric-band-vs-sleeve'];
  assert.equal(untouched,undefined,'canonical extensionless route is not redirected');
});
test('sitemap and rendered internal links point straight at current authority pages',()=>{
  const oldPaths=Object.keys(legacyAuthorityRedirects);
  const canonical=['/shift-health/health-mot','/programme','/treatment-centre','/comparisons/surgery/gastric-band-vs-sleeve'];
  const xml='<urlset>'+[...oldPaths,...canonical].map(path=>'<url><loc>https://shiftsometimber.co.uk'+path+'</loc></url>').join('')+'</urlset>';
  const cleaned=reconcileSitemap(xml);
  for(const path of oldPaths)assert.ok(!cleaned.includes('<loc>https://shiftsometimber.co.uk'+path+'</loc>'),path);
  for(const path of canonical)assert.ok(cleaned.includes('<loc>https://shiftsometimber.co.uk'+path+'</loc>'),path);
  const legacy=shell.replace('</main>','<a href="/health-mot?from=tools">MOT</a><a href="https://shiftsometimber.co.uk/founding-members#join">Founding</a><a href="/comparisons/surgery/gastric-band-vs-sleeve.html">Compare</a></main>');
  const rendered=reconcilePublicDocument(legacy,'/tools');
  assert.match(rendered,/href="\/shift-health\/health-mot\?from=tools"/);
  assert.match(rendered,/href="\/programme#join"/);
  assert.match(rendered,/href="\/comparisons\/surgery\/gastric-band-vs-sleeve"/);
  assert.doesNotMatch(rendered,/href="(?:https:\/\/shiftsometimber\.co\.uk)?\/(?:health-mot|founding-members|comparisons\/surgery\/gastric-band-vs-sleeve\.html)/);
});
test('high-value hubs now pass internal authority to pages Google is already testing',()=>{
  const cases={
    '/treatment-centre':['/comparisons/medications/mounjaro-vs-saxenda','/comparisons/medications/mounjaro-vs-orlistat','/guides/nhs-weight-loss-medication-pathways'],
    '/mens-weight-management':['/guides/weight-loss-surgery-uk-costs-guide','/mental-health/mental-health-and-weight'],
    '/weight-loss-injections-for-men':['/comparisons/medications/mounjaro-vs-saxenda','/compare-weight-loss-treatments'],
  };
  for(const [path,links] of Object.entries(cases)){
    const rendered=reconcilePublicDocument(shell,path);
    for(const href of links)assert.ok(rendered.includes('href="'+href+'"'),path+' -> '+href);
  }
});

test('canonical replacement handles href-first, mixed-case, unquoted and duplicate tags',()=>{
  for(const tag of [`<link href='/parent' rel='canonical'/>`,`<LINK HREF="/parent" REL="canonical">`,`<link href=/parent rel=canonical>`]){
    const html=renderWatchDocument(shell.replace('</head>',tag+'</head>'),{available:false});
    assert.equal((html.match(/\brel=["']?canonical/gi)||[]).length,1);
    assert.match(html,/href="https:\/\/shiftsometimber.co.uk\/treatment-centre\/medicines-watch"/);
  }
});
test('health aliases return readiness only and never initialise schema or count users',async()=>{
  const queries=[],env={DB:{prepare(sql){queries.push(sql);return {first:async()=>({ready:1,users:999,version:'private'})}}}};
  for(const path of ['/health','/v1/health']){
    const r=await worker.fetch(new Request('https://api.shiftsometimber.co.uk'+path),env,{});
    assert.equal(r.status,200);assert.deepEqual(await r.json(),{ok:true});assert.equal(r.headers.get('cache-control'),'no-store');
  }
  assert.deepEqual(queries,['SELECT 1 AS ready','SELECT 1 AS ready']);
  const failed=await publicHealthResponse(new Request('https://example.com/health'),{});
  assert.equal(failed.status,503);assert.deepEqual(await failed.json(),{ok:false});
});
function database(t){const sqlite=new DatabaseSync(':memory:');t.after(()=>sqlite.close());return {sqlite,async exec(sql){sqlite.exec(sql)},prepare(sql){let args=[];return {bind(...a){args=a;return this},async first(){return sqlite.prepare(sql).get(...args)||null},async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}}}}}}
const request=(body,ip='192.0.2.20',extra={})=>new Request('https://shiftsometimber.co.uk/v1/contact',{method:'POST',headers:{'content-type':'application/json','CF-Connecting-IP':ip,...extra},body:JSON.stringify(body)});
const payload={name:'Security test',email:'arbitrary@example.com',message:'Do not relay this content',consent:true,turnstileToken:'single-use'};
function environment(t){const sent=[],DB=database(t);return {sent,DB,TURNSTILE_SECRET_KEY:'test-secret',TURNSTILE_SITE_KEY:'test-site',EMAIL:{async send(mail){sent.push(mail);return {id:'mock-only'}}}}}
test('contact fails closed without token or configuration and sends no email',async t=>{
  const env=environment(t);
  assert.equal((await continuityInterestRoutes(request({...payload,turnstileToken:''}),env)).status,400);
  assert.equal((await continuityInterestRoutes(request(payload,'192.0.2.21'),{...env,TURNSTILE_SECRET_KEY:''})).status,503);
  assert.equal(env.sent.length,0);
});
test('contact verifies action and hostname, rejects replay and only sends to a fixed SHIFT address',async t=>{
  const env=environment(t),seen=new Set();
  t.mock.method(globalThis,'fetch',async(url,options)=>{assert.equal(String(url),'https://challenges.cloudflare.com/turnstile/v0/siteverify');const token=options.body.get('response');const duplicate=seen.has(token);seen.add(token);return Response.json({success:!duplicate,action:token==='wrong-action'?'member_login':'contact_enquiry',hostname:token==='wrong-host'?'evil.example':'shiftsometimber.co.uk'})});
  const good=await continuityInterestRoutes(request(payload),env);assert.equal(good.status,201);
  assert.deepEqual(env.sent.map(x=>x.to),['hello@shiftsometimber.co.uk']);
  assert.match(env.sent[0].text,/arbitrary@example.com/);
  for(const [i,token] of ['single-use','wrong-action','wrong-host'].entries())assert.equal((await continuityInterestRoutes(request({...payload,turnstileToken:token},'192.0.2.'+(30+i)),env)).status,403);
  assert.equal(env.sent.length,1);
});
test('contact atomic rate claim blocks simultaneous requests and ignores spoofed forwarded IP',async t=>{
  const env=environment(t),responses=await Promise.all(Array.from({length:8},(_,i)=>continuityInterestRoutes(request({...payload,turnstileToken:''},'192.0.2.50',{'X-Forwarded-For':'192.0.2.'+i}),env)));
  assert.equal(responses.filter(r=>r.status===400).length,1);assert.equal(responses.filter(r=>r.status===429).length,7);assert.equal(env.sent.length,0);
  assert.equal(env.DB.sqlite.prepare('SELECT COUNT(*) n FROM contact_attempts').get().n,1);
});
test('contact rejects oversize requests and untrusted origins before sending',async t=>{
  const env=environment(t);
  assert.equal((await continuityInterestRoutes(request({...payload,message:'x'.repeat(17000)}),env)).status,413);
  assert.equal((await continuityInterestRoutes(request(payload,'192.0.2.60',{Origin:'https://evil.example'}),env)).status,403);
  assert.equal(env.sent.length,0);
});
test('contact client awaits its own challenge and carries the token to the endpoint',()=>{
  const source=readFileSync(new URL('../worker-entry-v6.js',import.meta.url),'utf8');
  assert.match(source,/getToken\('contact_enquiry',form\)/);
  assert.match(source,/JSON.stringify\(\{name,email,type,message,consent,turnstileToken\}\)/);
});
