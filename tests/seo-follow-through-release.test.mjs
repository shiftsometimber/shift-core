import test from 'node:test';import assert from 'node:assert/strict';
import {FOLLOW_THROUGH,FOLLOW_THROUGH_PATHS,applyFollowThrough,withSeoFollowThrough} from '../public-seo-follow-through.mjs';
import {publicSiteStreamMessages} from '../public-site-stream.mjs';
import {validateFollowComposition} from '../release/seo-follow-through-scope.mjs';
import {assertCoachingChangedPath,FOLLOW_MODIFIED_PATHS} from '../shift-coach/release-contract.mjs';
import {readFileSync} from 'node:fs';
test('reviewed v3 composition and exact bounded public changes remain fixed',()=>{
 const c=JSON.parse(readFileSync('shift-coach/release-manifest.json')).seoFollowThroughComposition;assert.doesNotThrow(()=>validateFollowComposition(c));
 assert.equal(FOLLOW_THROUGH.contextLinks.flatMap(c=>c.links).length,191);assert.equal(new Set(FOLLOW_THROUGH.contextLinks.map(c=>c.path)).size,150);assert.equal(FOLLOW_THROUGH.ownerCopy.length,2);assert.equal(FOLLOW_THROUGH.restoreArchives.length,4);assert.equal(FOLLOW_THROUGH_PATHS.length,155);
 for(const change of [{payloadSource:'a'.repeat(40)},{base:'a'.repeat(40)},{payloadPaths:['unknown']},{maintenancePaths:['unknown']},{ownerApproval:{...c.ownerApproval,instruction:'unseen draft'}}])assert.throws(()=>validateFollowComposition({...c,...change}));
});
test('coaching scope preserves exact added versus modified follow-through statuses',()=>{
 for(const path of FOLLOW_MODIFIED_PATHS)assert.doesNotThrow(()=>assertCoachingChangedPath('M',path));
 for(const path of ['public-seo-follow-through.mjs','release/seo-follow-through-scope.mjs','tests/seo-follow-through-release.test.mjs'])assert.doesNotThrow(()=>assertCoachingChangedPath('A',path));
 assert.throws(()=>assertCoachingChangedPath('A','editorial/five-articles/proof.mjs'));
 assert.throws(()=>assertCoachingChangedPath('M','public-seo-follow-through.mjs'));
});
test('contextual links preserve visible words, do not repeat, and fail closed on ambiguous paragraphs',()=>{
 const text=s=>s.replace(/<[^>]*>/g,'');
 for(const c of FOLLOW_THROUGH.contextLinks){assert.equal(text(c.before),text(c.after));assert.equal(applyFollowThrough(c.before,c.path),c.after);assert.equal(applyFollowThrough(c.after,c.path),c.after);assert.equal(applyFollowThrough(c.before+c.before,c.path),c.before+c.before);}
});
test('only four reviewed archive paths may change indexing and unrelated restrictions remain',async()=>{
 for(const path of [...FOLLOW_THROUGH.restoreArchives,'/medicine-news/bolt-pharmacy-ads-banned-asa']){
 const body='<meta name="robots" content="noindex,follow"><p>Existing publication</p>';
 const r=await withSeoFollowThrough(new Response(body,{headers:{'content-type':'text/html','x-robots-tag':'noindex, follow'}}),new Request('https://shiftsometimber.co.uk'+path));
 const restored=FOLLOW_THROUGH.restoreArchives.includes(path);assert.equal(r.headers.get('x-robots-tag'),restored?null:'noindex, follow');assert.equal((await r.text()).includes('content="index,follow"'),restored);
 const kept=await withSeoFollowThrough(new Response(body,{headers:{'content-type':'text/html','x-robots-tag':'noindex, noarchive'}}),new Request('https://shiftsometimber.co.uk'+path));assert.equal(kept.headers.get('x-robots-tag'),'noindex, noarchive');
 }
});
test('wrapper preserves protected routes, errors and non-HTML responses and handles HEAD',async()=>{
 for(const path of ['/','/start-here','/member/dashboard','/treatment-order','/sitemap.xml']){const r=new Response('unchanged',{headers:{'content-type':'text/html'}});assert.equal(await withSeoFollowThrough(r,new Request('https://shiftsometimber.co.uk'+path)),r);}
 const path=FOLLOW_THROUGH_PATHS[0];for(const [method,status,type] of [['POST',200,'text/html'],['GET',404,'text/html'],['GET',200,'application/json']]){const r=new Response('preserved',{status,headers:{'content-type':type}});assert.equal(await withSeoFollowThrough(r,new Request('https://shiftsometimber.co.uk'+path,{method})),r);}
 const r=await withSeoFollowThrough(new Response('body',{headers:{'content-type':'text/html','etag':'old','content-length':'4'}}),new Request('https://shiftsometimber.co.uk'+path,{method:'HEAD'}));assert.equal(await r.text(),'');assert.equal(r.headers.get('etag'),null);assert.equal(r.headers.get('content-length'),null);
});
test('short public stream prompt cannot replace clinical, private, historical or unrecognised requests',()=>{
 const original=[{role:'system',content:'complete privacy and clinical rules'}],source={reviewState:'published_site',citation:'https://shiftsometimber.co.uk/life-back',title:'Life Back',content:'Record your personal goals and small wins.'};
 const args={message:'What is Life Back?',evidence:[source],journeyUsed:false,history:[],original};const fast=publicSiteStreamMessages(args);assert.notEqual(fast,original);assert(fast[0].content.includes('No private member records'));assert(fast[1].content.includes(source.content));assert(fast[0].content.includes('not proof of clinical review'));
 for(const patch of [{journeyUsed:true},{history:[{role:'user',content:'saved'}]},{message:'What is Life Back? Tell me my dose'},{message:'Should I stop Wegovy?'},{evidence:[{...source,reviewState:'external_unreviewed'}]},{evidence:[{...source,citation:'https://shiftsometimber.co.uk/other'}]},{evidence:[source,source]}])assert.equal(publicSiteStreamMessages({...args,...patch}),original);
 assert.equal(publicSiteStreamMessages({...args,message:'WHAT  IS LIFE BACK'}).length,2);
});

import {preserveFollowThrough} from '../release/seo-follow-through-preservation.mjs';
test('historical preservation reverses only exact approved paragraphs and rejects missing or duplicate additions',()=>{
 for(const c of [...FOLLOW_THROUGH.contextLinks,...FOLLOW_THROUGH.ownerCopy]){
  const before=Buffer.from('<main>'+c.before+'</main>'),after=Buffer.from('<main>'+c.after+'</main>');
  // Some pages own multiple paragraphs: use their complete reviewed fixture.
  const changes=[...FOLLOW_THROUGH.contextLinks,...FOLLOW_THROUGH.ownerCopy].filter(x=>x.path===c.path);
  const archive=FOLLOW_THROUGH.restoreArchives.includes(c.path),oldHead=archive?'<meta name="robots" content="noindex,follow">':'',newHead=archive?'<meta name="robots" content="index,follow">':'';
  const old=Buffer.from(oldHead+'<main>'+changes.map(x=>x.before).join('')+'</main>'),current=Buffer.from(newHead+'<main>'+changes.map(x=>x.after).join('')+'</main>');
  assert.equal(preserveFollowThrough(c.path,current,{required:true}).toString(),old.toString());
  assert.equal(preserveFollowThrough(c.path,old).toString(),old.toString());
  assert.throws(()=>preserveFollowThrough(c.path,old,{required:true}));
  assert.throws(()=>preserveFollowThrough(c.path,Buffer.from(current.toString().replace(c.after,c.after+c.after)),{required:true}));
  const extra=Buffer.from(current.toString().replace('</main>','<p>Unapproved additional copy remains visible to the hash gate.</p></main>'));
  assert.notEqual(preserveFollowThrough(c.path,extra,{required:true}).toString(),old.toString());
 }
 const privateBody=Buffer.from('<main>Private fixture</main>');assert.equal(preserveFollowThrough('/member/dashboard',privateBody,{required:true}),privateBody);
});

import {validateTabletGuidance,TABLET_GUIDANCE_BASE,TABLET_GUIDANCE_PATHS,followPinnedRef,followHistoricalRead} from '../release/seo-follow-through-scope.mjs';
test('tablet composition pins finite payload bytes without weakening previous SEO authority',()=>{
 const prior=JSON.parse(readFileSync('shift-coach/release-manifest.json')).seoFollowThroughComposition;
 const t={proof:'TABLET_GUIDANCE_EXACT_V1',base:TABLET_GUIDANCE_BASE,source:'a'.repeat(40),paths:TABLET_GUIDANCE_PATHS};
 const c={...prior,tabletGuidanceComposition:t};delete c.integrationComposition;
 assert.doesNotThrow(()=>validateFollowComposition(c));
 for(const p of t.paths)assert.equal(followPinnedRef(c,p),t.source);
 const historical=followHistoricalRead((ref,p)=>ref+':'+p,c);
 assert.equal(historical('HEAD','public-practical-guides.mjs'),TABLET_GUIDANCE_BASE+':public-practical-guides.mjs');
 assert.equal(historical('HEAD','release/seo-follow-through-scope.mjs'),prior.base+':release/seo-follow-through-scope.mjs');
 assert.equal(historical('HEAD','worker.js'),'HEAD:worker.js');
 for(const patch of [{base:'b'.repeat(40)},{paths:[...t.paths,'worker.js']},{source:'HEAD'},{run:0,proofSource:'c'.repeat(40)}])assert.throws(()=>validateTabletGuidance({...t,...patch}));
});

import {validateSeoIntegration,verifySeoIntegration,SEO_INTEGRATION_PATHS} from '../release/seo-follow-through-scope.mjs';
test('combined SEO release pins exact conflict resolutions and preserves unrelated drift checks',()=>{
 const c=JSON.parse(readFileSync('shift-coach/release-manifest.json')).seoFollowThroughComposition.integrationComposition;validateSeoIntegration(c);verifySeoIntegration(c);
 assert(SEO_INTEGRATION_PATHS.includes('shift-coach/worker.mjs'));assert.throws(()=>validateSeoIntegration({...c,proof:'arbitrary'}));assert.throws(()=>validateSeoIntegration({...c,paths:[...c.paths,'other']}));assert.throws(()=>validateSeoIntegration({...c,base:'4460ea56f931da4003ace68d5d404831c47e08f7'}));
});
