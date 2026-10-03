import {test} from 'node:test';
import assert from 'node:assert/strict';
import {repairHtml,trustRoute,withTrustRepair,withContactReference,pages} from './public-trust-repair.mjs';
const req=(path,opts)=>new Request('https://shiftsometimber.co.uk'+path,opts);
const html='<html><head><title>Terms</title><link rel="canonical" href="https://shiftsometimber.co.uk/"></head><body><header>KEEP</header><main><h1>Terms</h1></main><footer>KEEP</footer></body></html>';
test('homepage body and all headers remain byte-for-byte untouched',async()=>{const r=new Response(html,{headers:{'Content-Type':'text/html','ETag':'home','Cache-Control':'max-age=300'}});assert.equal(await withTrustRepair(req('/'),r),r);assert.equal(repairHtml(html,'/'),html)});
test('unrelated page and API are untouched',async()=>{for(const path of ['/about','/v1/shift/progress-photo','/v1/member/state']){const r=new Response(html,{headers:{'Content-Type':'text/html'}});assert.equal(await withTrustRepair(req(path),r),r);assert.equal(trustRoute(req(path)),null)}});
test('withdraw generation on direct API while keeping real photo endpoints',()=>{assert.equal(trustRoute(req('/v1/shift/visualise',{method:'POST'})).status,410);assert.equal(trustRoute(req('/v1/shift/progress-photo',{method:'POST'})),null)});
test('remove generated-image controls; preserve original photo controls and compatibility input',()=>{const source='<input id="saveOriginal"><label class="consent"><input id="visualConsent" type="checkbox">Generate consent</label><h3>Weight illustrations</h3><div><button class="visual-gen">−25%</button></div><h3>Saved real progress photos</h3><div id="savedPhotos"></div>';const out=repairHtml(source,'/member/dashboard');assert(!out.includes('visual-gen'));assert(!out.includes('−25%'));assert(out.includes('saveOriginal'));assert(out.includes('savedPhotos'));assert(out.includes('hidden disabled'))});
test('new legal/status and accessibility pages preserve shell',async()=>{for(const [p,[title]] of Object.entries(pages)){const r=await withTrustRepair(req(p),new Response(html,{headers:{'Content-Type':'text/html','ETag':'stale'}}));const out=await r.text();assert(out.includes(title));assert(out.includes('<header>KEEP</header>'));assert(out.includes('<footer>KEEP</footer>'));assert(out.includes('https://shiftsometimber.co.uk'+p));assert.equal(r.headers.get('ETag'),null)}});
test('news pages are noindex and crisis article preserves newly corrected research',async()=>{const r=await withTrustRepair(req('/medicine-news/semaglutide-suicidality'),new Response(html.replace('<h1>Terms</h1>','<p>Very low certainty; inconclusive evidence.</p>'),{headers:{'Content-Type':'text/html'}}));assert.equal(r.headers.get('X-Robots-Tag'),'noindex, follow');const out=await r.text();assert(out.includes('inconclusive evidence'));assert(out.includes('tel:116123'));assert(out.includes('tel:999'))});
test('lounge has its own canonical',()=>assert(repairHtml(html,'/lounge').includes('href="https://shiftsometimber.co.uk/lounge"')));
test('prototype clinician shell returns 404 and is removed from robots',async()=>{assert.equal(trustRoute(req('/clinician-dashboard-v3d')).status,404);const r=await withTrustRepair(req('/robots.txt'),new Response('User-agent: *\nDisallow: /member\nDisallow: /clinician-dashboard-v3d\n'));assert.equal(await r.text(),'User-agent: *\nDisallow: /member\n')});
test('security contact exists with expiry',async()=>{const r=trustRoute(req('/.well-known/security.txt'));assert.match(await r.text(),/Contact: mailto:hello@shiftsometimber.co.uk\nExpires:/)});
test('contact removes second submitting script and preserves main handler',()=>{const out=repairHtml('<script src="/assets/v42.js"></script><script defer src="/assets/contact-submit-v4.js?v=2"></script>','/contact');assert(out.includes('/assets/v42.js'));assert(!out.includes('contact-submit-v4'));assert(out.includes('contact-reference-init.js'))});
test('product reference survives submission without losing security token',async()=>{const r=await withContactReference(req('/v1/contact',{method:'POST',headers:{'Referer':'https://shiftsometimber.co.uk/contact?product=abc','Content-Type':'application/json'},body:JSON.stringify({message:'Please help',turnstileToken:'TEST',consent:true})}));const b=await r.json();assert.equal(b.message,'Please help\n\nSHIFT Health reference: abc');assert.equal(b.turnstileToken,'TEST');assert.equal(b.consent,true)});
test('foreign referer and unrelated forms do not alter payload',async()=>{const r=req('/v1/contact',{method:'POST',headers:{Referer:'https://example.org/contact?product=abc'},body:'{}'});assert.equal(await withContactReference(r),r)});

test('Lounge stays on its public landing page and emits one canonical',()=>{const source=html.replace('</head>',`<meta http-equiv="refresh" content="0;url=/"><script>window.location.replace('/');</script><link rel="canonical" href="https://shiftsometimber.co.uk/lounge"></head>`);const out=repairHtml(source,'/lounge');assert(!out.includes('http-equiv="refresh"'));assert(!out.includes('window.location.replace'));assert.equal((out.match(/rel="canonical"/g)||[]).length,1);assert(out.includes('href="https://shiftsometimber.co.uk/lounge"'))});

import {restoreTrustCentre} from './public-trust-repair.mjs';
test('release comparison admits only the exact treatment repair and retains unrelated drift',()=>{
 const prior='<main>Payment does not guarantee prescribing. Payment does not guarantee prescribing.</main>';
 const current=repairHtml(prior,'/treatment-centre');
 assert.equal(restoreTrustCentre('/treatment-centre',current,{required:true}),prior);
 assert.equal(restoreTrustCentre('/treatment-centre',prior),prior);
 assert.throws(()=>restoreTrustCentre('/treatment-centre',prior,{required:true}));
 assert.throws(()=>restoreTrustCentre('/treatment-centre',current.replace('Treatment ordering and payment are not currently open.','')));
 assert.notEqual(restoreTrustCentre('/treatment-centre',current.replace('<main>','<main>UNRELATED CHANGE')),prior);
 assert.equal(restoreTrustCentre('/',current,{required:true}),current);
});

test('release comparison recognises only exact reviewed MOT guide wording',()=>{
 const before='<main>Explore the SHIFT Health MOT home blood test and what it covers.<a>Explore the Health MOT</a>Payment does not guarantee prescribing. Payment does not guarantee prescribing.</main>';
 const current=before.replace('Explore the SHIFT Health MOT home blood test and what it covers.','The Health MOT guide explains a proposed blood-test route and how it differs from the older browser questionnaire. No test or clinical review is booked by reading it.').replace('>Explore the Health MOT</a>','>Read the Health MOT guide</a>');
 assert.equal(restoreTrustCentre('/treatment-centre',current),before);
 assert.equal(restoreTrustCentre('/treatment-centre',repairHtml(current,'/treatment-centre'),{required:true}),before);
 assert.throws(()=>restoreTrustCentre('/treatment-centre',current.replace('>Read the Health MOT guide</a>','>Other</a>')));
 assert.throws(()=>restoreTrustCentre('/treatment-centre',current+'<a>Read the Health MOT guide</a>'));
 assert.notEqual(restoreTrustCentre('/treatment-centre',current.replace('<main>','<main>UNRELATED')),before);
});
