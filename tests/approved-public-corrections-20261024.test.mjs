import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {approvedMedicalArticle,approvedTelemetryAsset,approvedComparisonAnswer} from '../approved-public-corrections-20261024.mjs';
import {approved} from '../approved-public-corrections-data-20261024.mjs';
import {articleHTML} from '../babylove/dynamic-public.mjs';
const before=JSON.parse(fs.readFileSync(new URL('./fixtures/approved-corrections-20261024/nhs-before.json',import.meta.url)));
const hash=s=>createHash('sha256').update(s).digest('hex');
test('exact approved NHS correction preserves owner, publication date, metadata and one title',async()=>{
 const row=await approvedMedicalArticle(before);assert.equal(hash(row.body),approved.afterHash);
 for(const k of ['id','title','slug','author','summary','seo_title','status','publish_at'])assert.equal(row[k],before[k]);
 const html=articleHTML(row);assert.equal((html.match(/<h1\b/g)||[]).length,1);assert(html.includes('four of five specified conditions'));
 assert(!html.includes('On paper this meets the national NHS threshold'));assert(html.includes('does <strong>not</strong> meet'));
 assert(html.includes('https://shiftsometimber.co.uk/articles/'+before.slug));assert(html.includes('"datePublished":"'+before.publish_at+'"'));
 assert.equal(before.body.includes('On paper this meets the national NHS threshold'),true);
});
test('newer CMS copy, another article, unpublished content and owned editorial releases are never overwritten',async()=>{
 for(const patch of [{body:before.body+'Newer revision'},{id:33},{slug:'another-article'},{status:'draft'},{publish_at:'2026-10-20'},{editorial:true}]){const row={...before,...patch};assert.equal(await approvedMedicalArticle(row),row);}
});
test('Saxenda answer is an additive exact insertion with publication metadata, security headers and unrelated bytes intact',async()=>{
 const html='<html><head><link rel="canonical" href="https://shiftsometimber.co.uk/comparisons/medications/saxenda-vs-orlistat"><meta name="datePublished" content="2026-08-01"></head><body><main><h1>Existing comparison</h1><h2 data-section="03">Which is easier to live with?</h2><p>Existing answer.</p><h2 data-section="04">NHS vs private reality</h2><p>Keep everything.</p></main></body></html>';
 const req=new Request('https://shiftsometimber.co.uk/comparisons/medications/saxenda-vs-orlistat');
 const result=await approvedComparisonAnswer(req,new Response(html,{headers:{'Content-Type':'text/html','Content-Security-Policy':"default-src 'self'",'Strict-Transport-Security':'max-age=31536000','X-Frame-Options':'SAMEORIGIN'}}));
 const body=await result.text();assert.equal(body.replace(approved.comparisonHTML,''),html);assert(body.includes('Can you take Saxenda and Orlistat together?'));assert(body.includes('safety and efficacy have not been established'));
 for(const k of ['Content-Security-Policy','Strict-Transport-Security','X-Frame-Options'])assert(result.headers.get(k));
 const again=await approvedComparisonAnswer(req,new Response(body,{headers:{'Content-Type':'text/html'}}));assert.equal(await again.text(),body);
 await assert.rejects(()=>approvedComparisonAnswer(req,new Response('<main>Changed template</main>',{headers:{'Content-Type':'text/html'}})),/anchor changed/);
});
test('Bloods title correction removes double encoding and keeps structured data truthful',async()=>{
 const html='<title>Explore Baseline, Advanced &amp;amp; Complete | SHIFT Bloods</title><meta property="og:title" content="Explore Baseline, Advanced &amp;amp; Complete | SHIFT Bloods"><script type="application/ld+json">{"@type":"WebPage","name":"Explore Baseline, Advanced &amp; Complete | SHIFT Bloods"}</script>';
 const req=new Request('https://shiftsometimber.co.uk/shift-health/blood-tests');
 const result=await approvedComparisonAnswer(req,new Response(html,{headers:{'Content-Type':'text/html','ETag':'old','Content-Length':String(html.length),'Content-Security-Policy':"default-src 'self'",'Strict-Transport-Security':'max-age=31536000','X-Frame-Options':'SAMEORIGIN'}}));
 const body=await result.text();assert(body.includes('<title>Explore Baseline, Advanced &amp; Complete | SHIFT Bloods</title>'));assert(body.includes('content="Explore Baseline, Advanced &amp; Complete | SHIFT Bloods"'));assert(body.includes('"name":"Explore Baseline, Advanced & Complete | SHIFT Bloods"'));assert(!body.includes('&amp;amp;'));
 assert.equal(result.headers.get('ETag'),null);assert.equal(result.headers.get('Content-Length'),null);assert.equal(result.headers.get('X-Shift-Approved-Correction'),'bloods-title-20261029');
 for(const k of ['Content-Security-Policy','Strict-Transport-Security','X-Frame-Options'])assert(result.headers.get(k));
 const again=await approvedComparisonAnswer(req,new Response(body,{headers:{'Content-Type':'text/html'}}));assert.equal(await again.text(),body);assert.equal(again.headers.get('X-Shift-Approved-Correction'),null);
});
test('homepage, member pages, private methods and unrelated assets remain untouched',async()=>{
 for(const path of ['/','/my-timber','/member/dashboard','/articles/another','/contact']){const request=new Request('https://shiftsometimber.co.uk'+path),r=new Response('unchanged');assert.equal(await approvedComparisonAnswer(request,r),r);assert.equal(approvedTelemetryAsset(request),null);}
 assert.equal(approvedTelemetryAsset(new Request('https://example.invalid/assets/shift-product-events-v42m.js')),null);
});
test('served telemetry matches the reviewed candidate exactly and retains calculator activation',async()=>{
 const request=new Request('https://shiftsometimber.co.uk/assets/shift-product-events-v42m.js?v=1'),r=approvedTelemetryAsset(request),js=await r.text();
 assert.equal(hash(js),'cd102ba901bc3e6733abdfb7c342334b50aff16cf15cbaf30b0276b4833fae2d');assert(!js.includes('shift_form_submit'));assert(js.includes('shift_tool_used'));assert.equal(r.headers.get('Cache-Control'),'no-store');
 assert.equal((await approvedTelemetryAsset(new Request(request,{method:'HEAD'})).text()),'');assert.equal(approvedTelemetryAsset(new Request(request,{method:'POST'})).status,405);
});
