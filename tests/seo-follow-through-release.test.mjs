import test from 'node:test';import assert from 'node:assert/strict';
import {FOLLOW_THROUGH,FOLLOW_THROUGH_PATHS,applyFollowThrough,withSeoFollowThrough} from '../public-seo-follow-through.mjs';
import {expectedSeo794ArticleBody} from '../release/seo794-preservation.mjs';
import {assertCoachingChangedPath} from '../shift-coach/release-contract.mjs';
import {publicSiteStreamMessages} from '../public-site-stream.mjs';
import {validateFollowComposition} from '../release/seo-follow-through-scope.mjs';
import {readFileSync} from 'node:fs';
test('reviewed v3 composition and exact bounded public changes remain fixed',()=>{
 const c=JSON.parse(readFileSync('shift-coach/release-manifest.json')).seoFollowThroughComposition;assert.doesNotThrow(()=>validateFollowComposition(c));
 assert.equal(FOLLOW_THROUGH.contextLinks.flatMap(c=>c.links).length,191);assert.equal(new Set(FOLLOW_THROUGH.contextLinks.map(c=>c.path)).size,150);assert.equal(FOLLOW_THROUGH.ownerCopy.length,2);assert.equal(FOLLOW_THROUGH.restoreArchives.length,4);assert.equal(FOLLOW_THROUGH_PATHS.length,155);
 for(const change of [{payloadSource:'a'.repeat(40)},{base:'a'.repeat(40)},{payloadPaths:['unknown']},{maintenancePaths:['unknown']},{ownerApproval:{...c.ownerApproval,instruction:'unseen draft'}}])assert.throws(()=>validateFollowComposition({...c,...change}));
});
test('contextual links preserve visible words, do not repeat, and fail closed on ambiguous paragraphs',()=>{
 const text=s=>s.replace(/<[^>]*>/g,'');
 for(const c of FOLLOW_THROUGH.contextLinks){assert.equal(text(c.before),text(c.after));assert.equal(applyFollowThrough(c.before,c.path),c.after);assert.equal(applyFollowThrough(c.after,c.path),c.after);assert.equal(applyFollowThrough(c.before+c.before,c.path),c.before+c.before);}
});
test('five-article live expectation composes both approved publication layers and no copy change',()=>{
 const path='/comparisons/medications/mounjaro-vs-saxenda',change=FOLLOW_THROUGH.contextLinks.find(c=>c.path===path);
 const source='<main>'+change.before+'<p>Keep every other byte.</p></main>',expected='<main>'+change.after+'<p>Keep every other byte.</p></main>';
 const published=applyFollowThrough(expectedSeo794ArticleBody(source,path),path);
 assert.equal(published,expected);assert.equal(published.replace(/<[^>]*>/g,''),source.replace(/<[^>]*>/g,''));
 assert.notEqual(published,expected.replace('Keep every other byte.','Lost copy.'));
});
test('coaching scope distinguishes existing follow-through files from additions',()=>{
 for(const path of ['ask-timber-v1.js','editorial/five-articles/proof.mjs','scripts/b1-release-scope.mjs','scripts/verify-knowledge-headings.cjs'])assert.doesNotThrow(()=>assertCoachingChangedPath('M',path));
 assert.doesNotThrow(()=>assertCoachingChangedPath('A','public-seo-follow-through.mjs'));
 assert.throws(()=>assertCoachingChangedPath('A','editorial/five-articles/proof.mjs'));
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
