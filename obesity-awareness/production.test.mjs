import {improveAnswerDepth} from '../public-seo-answer-depth.mjs';
import {preservePillarChrome} from './preservation.mjs';
import {amendPillarChrome} from './candidate.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';
import {withMaleObesity} from './production.mjs';import {pillarClient} from './measurement.mjs';import {renderContinuityDocument} from '../public-continuity.mjs';import {publicHeader,publicDrawer} from '../public-shell-contract.mjs';import {approvedFooter,approvedFooterStyles} from '../shared-footer.mjs';
const shell='<!doctype html><html lang="en-GB"><head><title>Existing</title>'+approvedFooterStyles+'</head><body>'+publicHeader+publicDrawer+'<main>Original</main>'+approvedFooter+'</body></html>';
const html=h=>new Response(h,{headers:{'Content-Type':'text/html','ETag':'old','Content-Length':'999'}});
const base={fetch:async req=>{const p=new URL(req.url).pathname;return p==='/sitemap.xml'?new Response('<urlset><url><loc>https://shiftsometimber.co.uk/original</loc></url></urlset>',{headers:{'Content-Type':'application/xml'}}):html(p==='/weight-loss-support-for-men'?renderContinuityDocument(shell,p):shell)}};
test('production hub has usable public action, optional review, authorship and indexable truthful metadata',async()=>{const w=withMaleObesity(base),r=await w.fetch(new Request('https://shiftsometimber.co.uk/male-obesity'),{}),h=await r.text();assert.equal(r.status,200);assert.match(h,/data-pillar-client/);assert.match(h,/Understand it\. Choose one step/);assert.match(h,/Written by Matt/);assert.doesNotMatch(h,/clinical sign-off is pending|noindex|reviewedBy/);assert.match(h,/data-male-obesity-footer/);assert.equal(r.headers.get('ETag'),null);const head=await w.fetch(new Request('https://shiftsometimber.co.uk/male-obesity',{method:'HEAD'}),{});assert.equal(await head.text(),'');assert.equal(head.status,200)});
test('production preserves homepage, private/API and write routes byte-for-byte; unrelated public robots preserved',async()=>{const w=withMaleObesity(base);for(const p of ['/','/index.html','/member/dashboard','/v1/me','/hq'])assert.equal(await(await w.fetch(new Request('https://shiftsometimber.co.uk'+p),{})).text(),shell);assert.equal(await(await w.fetch(new Request('https://shiftsometimber.co.uk/male-obesity',{method:'POST'}),{})).text(),shell);const h=await(await withMaleObesity({fetch:async()=>html(shell.replace('</head>','<meta name="robots" content="noindex,nofollow"></head>'))}).fetch(new Request('https://shiftsometimber.co.uk/some-public-page'),{})).text();assert.match(h,/noindex,nofollow/);assert.match(h,/data-male-obesity-footer/)});
test('production support has public-first action and no obsolete service claims; drift fails honestly',async()=>{const w=withMaleObesity(base),r=await w.fetch(new Request('https://shiftsometimber.co.uk/weight-loss-support-for-men'),{}),h=await r.text();assert.equal(r.status,200);assert.match(h,/My meal is/);assert.doesNotMatch(h,/12-week|Grub \+ Fit|Mounjaro|Wegovy|noindex/);const broken=withMaleObesity({fetch:async()=>html(shell)});assert.equal((await broken.fetch(new Request('https://shiftsometimber.co.uk/weight-loss-support-for-men'),{})).status,503);assert.equal((await withMaleObesity({fetch:async()=>new Response('down',{status:503})}).fetch(new Request('https://shiftsometimber.co.uk/male-obesity'),{})).status,503)});
test('sitemap adds hub once, leaves original entries and sets the recorded revision lastmod; slash alias redirects',async()=>{const w=withMaleObesity(base),r=await w.fetch(new Request('https://shiftsometimber.co.uk/sitemap.xml'),{}),s=await r.text();assert.equal((s.match(/male-obesity/g)||[]).length,1);assert.match(s,/original/);assert.match(s,/<lastmod>2026-10-10<\/lastmod>/);assert.equal((await w.fetch(new Request('https://shiftsometimber.co.uk/male-obesity/'),{})).status,301)});
test('feedback works without analytics or storage; consent sends only generic event, never answer or chosen step',()=>{for(const consent of [false,true]){const events=[],handlers={},status={textContent:''},feedback={hidden:true},buttons=['yes','effort','no'].map(v=>({dataset:{pillarHelp:v},addEventListener:(type,f)=>handlers[v]=f}));const review={querySelector:q=>q==='[data-pillar-tried]'?{addEventListener:(type,f)=>handlers.tried=f}:q==='[data-pillar-feedback]'?feedback:status,querySelectorAll:()=>buttons};const context={window:{SSTConsent:{get:()=>({analytics:consent})},dataLayer:events},document:{querySelector:()=>review,addEventListener:()=>{}}};vm.runInNewContext(pillarClient,context);handlers.tried();assert.equal(feedback.hidden,false);handlers.no();assert.match(status.textContent,/different approach/);handlers.effort();assert.match(status.textContent,/smaller/);handlers.yes();assert.match(status.textContent,/Keep/);assert.equal(events.length,consent?4:0);for(const e of events)assert.match(e.event,/^shift_pillar_(step_tried|review_used)$/);assert.ok(events.every(e=>Object.keys(e).join()==='event'));assert.doesNotMatch(pillarClient,/localStorage|fetch\(|sendBeacon|cookie|user_id/);}});

test('actual answer-depth support additions also have qualified claims',async()=>{const w=withMaleObesity({fetch:async()=>html(improveAnswerDepth(renderContinuityDocument(shell,'/weight-loss-support-for-men'),'/weight-loss-support-for-men'))});const r=await w.fetch(new Request('https://shiftsometimber.co.uk/weight-loss-support-for-men'),{}),h=await r.text();assert.equal(r.status,200);assert.doesNotMatch(h,/Look in Fit|choose your Next Shift|My Timber brings together food, movement/);assert.match(h,/one smaller organising step/)});
test('exact chrome preservation rejects footer/style drift and retains unrelated edits',()=>{const h=amendPillarChrome(shell,'/programme');assert.equal(preservePillarChrome('/programme',Buffer.from(h)).toString(),shell);assert.throws(()=>preservePillarChrome('/programme',Buffer.from(h.replace('Understanding obesity</a>','Changed</a>'))));assert.throws(()=>preservePillarChrome('/programme',Buffer.from(h.replace('repeat(6,','repeat(7,'))));assert.notEqual(preservePillarChrome('/programme',Buffer.from(h.replace('Original','Changed'))).toString(),shell)});
test('public measurement uses one existing GTM event route; suppression, withdrawal and unavailable collector stay silent',()=>{
 for(const mode of ['allowed','suppressed','withdrawn','missingConsent','missingCollector']){
  const events=[];let click;const window={SSTConsent:{get:()=>({analytics:mode!=='withdrawn'})},dataLayer:events,SST_ANALYTICS_SUPPRESSED:mode==='suppressed'};
  if(mode==='missingConsent')delete window.SSTConsent;if(mode==='missingCollector')delete window.dataLayer;
  vm.runInNewContext(pillarClient,{window,document:{querySelector:()=>null,addEventListener:(_,fn)=>click=fn}});
  click({target:{closest:()=>({getAttribute:()=> '#first-step'})}});
  assert.deepEqual(JSON.parse(JSON.stringify(events)),mode==='allowed'?[{event:'shift_pillar_first_step_opened'}]:[]);
 }
 assert.doesNotMatch(pillarClient,/gtag\(/);
});

import {wrapAnswerDepthWorker} from '../public-seo-answer-depth.mjs';
import {assertApprovedContinuityBody} from '../release/public-continuity-body-proof.mjs';
test('actual outer public-answer wrapper retains the complete qualified support body once',async()=>{
 const path='/weight-loss-support-for-men';
 for(const depthAlreadyPresent of [false,true]){
  const upstream={fetch:async()=>html(depthAlreadyPresent?improveAnswerDepth(renderContinuityDocument(shell,path),path):renderContinuityDocument(shell,path))};
  const response=await wrapAnswerDepthWorker(withMaleObesity(upstream)).fetch(new Request('https://shiftsometimber.co.uk'+path),{});
  const document=await response.text();assert.equal(response.status,200);
  assertApprovedContinuityBody(path,document);
  assert.equal((document.match(/id="shift-depth-free-my-timber"/g)||[]).length,1);
  assert.doesNotMatch(document,/Look in Fit|choose your Next Shift|12-week|Grub \+ Fit/);
  assert.match(document,/one smaller organising step/);
  assert.throws(()=>assertApprovedContinuityBody(path,document.replace('one smaller organising step','an unapproved promise')));
  assert.throws(()=>assertApprovedContinuityBody(path,document.replace('href="/male-obesity#healthcare"','href="/unapproved"')));
 }
});

// The real adapter must install the arrival client; a client-only unit test cannot prove this.
test('public support installs one arrival client while preserving the complete approved body and homepage',async()=>{
 const w=withMaleObesity(base),path='/weight-loss-support-for-men';
 const response=await w.fetch(new Request('https://shiftsometimber.co.uk'+path),{}),h=await response.text();
 assert.equal(response.status,200);assert.equal((h.match(/<script data-pillar-client>/g)||[]).length,1);assert.match(h,/function publicSupportArrival/);assertApprovedContinuityBody(path,h);
 assert.equal(await(await w.fetch(new Request('https://shiftsometimber.co.uk/'),{})).text(),shell);
});
