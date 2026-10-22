import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {londonEleven,nextRelease,validateSubmission,publicationDecision,revisionPreview,pendingReceipt,canonicalArticleUrl,sha256} from './contributor-policy.mjs';

const good=()=>({title:'A practical first health check',body:'Useful evidence-based information.\n\n[Start here](/start-here)',heroImage:{url:'https://shiftsometimber.co.uk/assets/og-default.jpg',alt:'SHIFT Some Timber',caption:'SHIFT'},metaDescription:'Practical questions for a first health check.',url:'/articles/first-health-check-test',keywords:['men’s health'],sources:[{title:'NHS Health Check',url:'https://www.nhs.uk/conditions/nhs-health-check/'}],author:"Matt O'Brien",editorialCheck:{result:'pass',reviewer:'Contributor editorial review'}});
test('11am stays at 11am across the 25 October 2026 clock change',()=>{
 assert.equal(londonEleven('2026-10-24'),'2026-10-24T10:00:00.000Z');
 assert.equal(londonEleven('2026-10-25'),'2026-10-25T11:00:00.000Z');
 assert.equal(londonEleven('2026-10-26'),'2026-10-26T11:00:00.000Z');
 assert.equal(nextRelease(Date.parse('2026-10-24T10:00:01Z')),'2026-10-25T11:00:00.000Z');
 assert.equal(nextRelease(Date.parse('2026-10-25T10:59:59Z')),'2026-10-25T11:00:00.000Z');
});
test('no backdating and no invalid calendar days',()=>{
 assert.throws(()=>londonEleven('2026-02-30'));
 assert.throws(()=>nextRelease(Date.parse('2026-10-25T11:00:01Z'),'2026-10-25'),/slot_has_passed/);
});
test('only article URLs can be proposed; normalisation cannot escape the scope',()=>{
 assert.equal(canonicalArticleUrl('/articles/a-useful-post'),'https://shiftsometimber.co.uk/articles/a-useful-post');
 for(const url of ['/','/start-here','https://example.com/articles/x','//example.com/articles/x','/articles/../start-here','/articles/%2e%2e/start-here','/articles/x?preview=1','/articles/x#section','https://user@shiftsometimber.co.uk/articles/x'])assert.throws(()=>canonicalArticleUrl(url));
});
test('complete contributor payload and named editorial declaration are retained',()=>{
 const result=validateSubmission(good());assert.equal(result.valid,true);assert.equal(result.article.heroImage.caption,'SHIFT');assert.equal(result.article.sources.length,1);
});
test('failures and unsafe markup remain drafts',()=>{
 for(const mutate of [p=>p.editorialCheck.result='fail',p=>p.body='<script>alert(1)</script>',p=>p.body='[Click](javascript:alert)',p=>p.heroImage.alt='',p=>p.sources=[],p=>p.body='TODO: insert copy',p=>p.url='/']){
  const p=good();mutate(p);const r=validateSubmission(p);assert.equal(r.valid,false);assert.ok(r.reasons.length);assert.equal(publicationDecision({valid:r.valid,exists:false,slotDue:true,siteChecksPassed:true}),'draft_failed');
 }
});
test('contributor pass cannot publish a refresh; an exact owner approval and unchanged base are required',()=>{
 const inputs={valid:true,exists:true,slotDue:true,siteChecksPassed:true};
 assert.equal(publicationDecision(inputs),'revision_awaiting_owner');
 assert.equal(publicationDecision({...inputs,ownerApproved:true,baseMatches:false}),'revision_base_changed');
 assert.equal(publicationDecision({...inputs,ownerApproved:true,baseMatches:true}),'ready_to_publish');
});
test('passing new articles still need site checks and their scheduled slot',()=>{
 assert.equal(publicationDecision({valid:true,exists:false,siteChecksPassed:false,slotDue:true}),'draft_site_checks_failed');
 assert.equal(publicationDecision({valid:true,exists:false,siteChecksPassed:true,slotDue:false}),'scheduled');
});
test('review comparison includes copy, metadata, sources and image changes',()=>{
 const current=good(),proposed=good();proposed.body='A revised body';proposed.heroImage={...proposed.heroImage,alt:'Changed alt text'};proposed.sources=[{title:'Another source',url:'https://www.nhs.uk/'}];
 assert.deepEqual(revisionPreview(current,proposed).map(x=>x.field),['body','heroImage','sources']);assert.equal(current.body,good().body);
});
test('received and scheduled are not falsely reported as live verification',()=>{
 for(const state of ['received','scheduled','revision_awaiting_owner']){
  const r=pendingReceipt(state);assert.equal(Object.keys(r.checks).length,6);assert.ok(Object.values(r.checks).every(c=>c.status==='pending'));
 }
});
test('exact payload changes alter approval identity',async()=>{
 const a=JSON.stringify(good()),p=good();p.heroImage.caption='Updated caption';assert.notEqual(await sha256(a),await sha256(JSON.stringify(p)));
});

// Both entrypoints share the production bindings. A contributor release must
// never restore the stale coaching configuration rejected by the live lane.
test('contributor bindings and access hold are identical in both Worker configurations',()=>{
 const production=readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8');
 const coaching=readFileSync(new URL('../wrangler.coaching.jsonc',import.meta.url),'utf8');
 assert.equal(coaching,production);
 for(const flag of ['DAILY_WEBSITE_CONTENT_ENABLED','DAILY_WEBSITE_EDITORIAL_AUTOPUBLISH','DAILY_EDITORIAL_NOTIFY_ENABLED','BLOG_ACCESS_ACCEPTED'])assert.match(production,new RegExp('"'+flag+'"\\s*:\\s*"false"'));
 for(const flag of ['BLOG_CONTRIBUTOR_ENABLED','BLOG_MEDIA_UPLOAD_ENABLED'])assert.match(production,new RegExp('"'+flag+'"\\s*:\\s*"true"'));
 assert.match(production,/"binding"\s*:\s*"BLOG_MEDIA"[^}]*"bucket_name"\s*:\s*"shift-blog-media"/);
 assert.match(production,/"crons"\s*:\s*\["\*\/15 \* \* \* \*"\]/);
});
