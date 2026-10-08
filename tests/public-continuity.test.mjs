import test from 'node:test';
import assert from 'node:assert/strict';
import {CONTINUITY_PATHS,CONTINUITY_REDIRECTS,continuityPages,renderContinuityDocument,continuityPublicRoute,continuitySitemap,addContinuityLinks,continuityEntries,OLD_LIFE_LINK,NEW_LIFE_LINK} from '../public-continuity.mjs';
import {preserveContinuityContent} from '../public-continuity-preservation.mjs';
const shell='<!doctype html><html><head><title>Programme</title><link href="/programme" rel="canonical"><meta name="description" content="old"><script defer src="/consent-v4a.js"></script></head><body class="programme-page one-shift"><header>Locked header</header><nav id="site-drawer">Locked drawer</nav><main id="main-content"><h1>Programme</h1>'+OLD_LIFE_LINK+'</main><footer>Locked footer</footer></body></html>';
test('public pages retain shell and expose unique canonical, heading and accurate structured data',()=>{
 for(const path of CONTINUITY_PATHS){const html=renderContinuityDocument(shell,path);for(const fragment of ['<header>Locked header</header>','<nav id="site-drawer">Locked drawer</nav>','<footer>Locked footer</footer>','/consent-v4a.js'])assert.ok(html.includes(fragment));assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.equal((html.match(/rel="canonical"/g)||[]).length,1);assert.ok(html.includes('href="https://shiftsometimber.co.uk'+path+'"'));const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];assert.equal(graph[0]['@type'],continuityPages[path].type);assert.equal(graph[0].url,'https://shiftsometimber.co.uk'+path);assert.ok(!graph[0].reviewedBy);assert.match(html,/<body class="one-shift">/)}
});
test('new aliases redirect canonically, HEAD has no body, failures do not turn into successful pages',async()=>{
 const get=async()=>new Response(shell,{headers:{'Content-Type':'text/html'}});
 for(const path of CONTINUITY_PATHS){const r=await continuityPublicRoute(new Request('https://shiftsometimber.co.uk'+path),get);assert.equal(r.status,200);assert.ok((await r.text()).includes(continuityPages[path].heading));const h=await continuityPublicRoute(new Request('https://shiftsometimber.co.uk'+path,{method:'HEAD'}),get);assert.equal(await h.text(),'');for(const suffix of ['/','.html']){const a=await continuityPublicRoute(new Request('https://shiftsometimber.co.uk'+path+suffix+'?from=test'),get);assert.equal(a.status,301);assert.equal(a.headers.get('location'),'https://shiftsometimber.co.uk'+path+'?from=test')}}
 assert.equal(await continuityPublicRoute(new Request('https://shiftsometimber.co.uk/life-back',{method:'POST'}),get),null);
 assert.equal((await continuityPublicRoute(new Request('https://shiftsometimber.co.uk/life-back'),async()=>new Response('unavailable',{status:503}))).status,503);
});
test('only the exact authorised additions are removed for preservation; unrelated edits still fail comparison',()=>{
 for(const path of Object.keys(continuityEntries)){const after=addContinuityLinks(shell,path);assert.equal(addContinuityLinks(after,path),after);assert.equal(preserveContinuityContent(path,Buffer.from(after),{required:true}).toString(),shell);assert.equal(preserveContinuityContent(path,Buffer.from(after.replace('class="continuity-links"','class="tampered"')),{required:true}).toString(),shell);assert.throws(()=>preserveContinuityContent(path,Buffer.from(shell),{required:true}),/missing/);assert.notEqual(preserveContinuityContent(path,Buffer.from(after.replace('Locked footer','Changed footer')),{required:true}).toString(),shell)}
 assert.ok(addContinuityLinks(shell,'/programme').includes(NEW_LIFE_LINK));assert.equal(addContinuityLinks(shell,'/'),shell);
});
test('sitemap gains every Continuity public page once and retains every original entry',()=>{
 const input='<urlset><url><loc>https://shiftsometimber.co.uk/original</loc></url></urlset>',out=continuitySitemap(input);assert.equal((out.match(/<loc>/g)||[]).length,1+CONTINUITY_PATHS.length);assert.ok(out.includes('<url><loc>https://shiftsometimber.co.uk/original</loc></url>'));for(const path of CONTINUITY_PATHS)assert.ok(out.includes('<loc>https://shiftsometimber.co.uk'+path+'</loc>'));assert.equal(continuitySitemap(out),out);
});

test('pretty Continuity aliases redirect to the existing canonical evidence pages without duplication',async()=>{
 const get=async()=>new Response(shell,{headers:{'Content-Type':'text/html'}});
 for(const [from,to] of Object.entries(CONTINUITY_REDIRECTS)){const r=await continuityPublicRoute(new Request('https://shiftsometimber.co.uk'+from+'?utm_source=test'),get);assert.equal(r.status,301);assert.equal(r.headers.get('location'),'https://shiftsometimber.co.uk'+to)}
});
test('portable Continuity front doors are substantial, linked and do not invent a clinical partner or reviewer',()=>{
 for(const path of ['/clinic-gone-quiet','/provider-switch','/husband-help']){const html=renderContinuityDocument(shell,path),text=html.replace(/<[^>]+>/g,' ');assert.ok(text.split(/\s+/).filter(Boolean).length>180,path);assert.match(html,/\/life-back|\/articles\/stopping-glp1|\/start-here/);assert.doesNotMatch(html,/reviewedBy|named clinical partner|our pharmacy partner is/i)}
 const switcher=renderContinuityDocument(shell,'/provider-switch');assert.match(switcher,/not promising a cheaper pen/i);assert.match(switcher,/not a guarantee/i);
 const clinic=renderContinuityDocument(shell,'/clinic-gone-quiet');assert.match(clinic,/support should not disappear/i);assert.match(clinic,/including when treatment started elsewhere/i);
 const partner=renderContinuityDocument(shell,'/husband-help');assert.match(partner,/food police/i);assert.match(partner,/Do not advise him to change, stop or restart prescription treatment/i);
});

test('preservation accepts the immediately previous approved Continuity block but rejects surrounding changes',()=>{
 const current=addContinuityLinks(shell,'/programme');
 const previous=current.replace(continuityEntries['/programme'],continuityEntries['/programme'].replace('When the clinic goes quiet →','Earlier approved wording →'));
 assert.equal(preserveContinuityContent('/programme',Buffer.from(previous),{required:true}).toString(),shell);
 assert.notEqual(preserveContinuityContent('/programme',Buffer.from(previous.replace('Locked footer','Changed footer')),{required:true}).toString(),shell);
});

test('partner sharing is low-friction and does not identify the sender or recipient',()=>{
 const html=renderContinuityDocument(shell,'/husband-help');
 assert.match(html,/data-share-my-timber/);assert.match(html,/someone-who-cares/);assert.match(html,/navigator\.share/);assert.match(html,/navigator\.clipboard/);
 assert.match(html,/My Timber is free\. No purchase is needed/);assert.doesNotMatch(html,/sender name|recipient email|phone number/i);
});
test('provider pilot keeps clinical ownership with the provider and exposes no member records',()=>{
 const html=renderContinuityDocument(shell,'/my-timber-for-providers');
 assert.match(html,/You keep the clinical relationship/);assert.match(html,/does not prescribe, change doses or replace your clinical monitoring/);
 assert.match(html,/week-4 return/);assert.match(html,/without giving a provider access to private member free text/);
 assert.match(html,/data-provider-pilot-cta/);assert.match(html,/provider_pilot_cta_click/);
 assert.doesNotMatch(html,/clinically reviewed|provider dashboard|patient-level data/i);
});

test('free weight-loss support page is canonical, indexable and answers the visible FAQs in structured data',()=>{
 const path='/weight-loss-support-for-men',html=renderContinuityDocument(shell,path);
 assert.match(html,/Free weight-loss support for men — before, during and after treatment/);
 assert.match(html,/No purchase needed/);assert.match(html,/does not matter who prescribed your treatment/);
 assert.match(html,/12-week after-treatment starting pathway/);assert.match(html,/If you never take medication/);
 assert.ok(html.includes('rel="canonical" href="https://shiftsometimber.co.uk'+path+'"'));
 assert.doesNotMatch(html,/noindex/i);
 const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
 const faq=graph.find(x=>x['@type']==='FAQPage');assert(faq);assert.equal(faq.mainEntity.length,6);
 for(const item of faq.mainEntity){assert.ok(html.includes(item.name));assert.ok(html.includes(item.acceptedAnswer.text))}
 assert.equal(graph[0].datePublished,'2026-10-07');assert.equal(graph[0].dateModified,'2026-10-07');
});
test('distribution links target the canonical support page only on relevant public surfaces',()=>{
 const paths=['/programme','/explore-knowledge','/treatment-centre','/compare-weight-loss-treatments','/mounjaro','/wegovy','/weight-loss-injections-for-men','/weight-loss-tablets-for-men','/guides/nhs-weight-loss-medication-pathways','/articles/mounjaro-cost-uk','/articles/wegovy-cost-uk','/articles/glp-1-weight-loss-uk'];
 for(const path of paths){const patched=addContinuityLinks(shell,path);assert.match(patched,/href="\/weight-loss-support-for-men"/,path)}
 for(const path of ['/','/start-here','/member/dashboard'])assert.equal(addContinuityLinks(shell,path),shell);
});

test('distribution lastmod touches only updated discovery surfaces and dates the new support page',()=>{
 const input='<urlset><url><loc>https://shiftsometimber.co.uk/mounjaro</loc><lastmod>2026-09-01</lastmod></url><url><loc>https://shiftsometimber.co.uk/unrelated</loc><lastmod>2026-09-02</lastmod></url></urlset>';
 const out=continuitySitemap(input);
 assert.match(out,/<loc>https:\/\/shiftsometimber\.co\.uk\/mounjaro<\/loc><lastmod>2026-10-07<\/lastmod>/);
 assert.match(out,/<loc>https:\/\/shiftsometimber\.co\.uk\/unrelated<\/loc><lastmod>2026-09-02<\/lastmod>/);
 assert.match(out,/<loc>https:\/\/shiftsometimber\.co\.uk\/weight-loss-support-for-men<\/loc><lastmod>2026-10-07<\/lastmod>/);
});
