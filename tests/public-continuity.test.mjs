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
 for(const path of Object.keys(continuityEntries)){const after=addContinuityLinks(shell,path);assert.equal(addContinuityLinks(after,path),after);assert.equal(preserveContinuityContent(path,Buffer.from(after),{required:true}).toString(),shell);assert.throws(()=>preserveContinuityContent(path,Buffer.from(after.replace('class="continuity-links"','class="tampered"')),{required:true}),/differs/);assert.throws(()=>preserveContinuityContent(path,Buffer.from(shell),{required:true}),/missing/);assert.notEqual(preserveContinuityContent(path,Buffer.from(after.replace('Locked footer','Changed footer')),{required:true}).toString(),shell)}
 assert.ok(addContinuityLinks(shell,'/programme').includes(NEW_LIFE_LINK));assert.equal(addContinuityLinks(shell,'/'),shell);
});
test('sitemap gains exactly the two public pages once and retains every original entry',()=>{
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
