import test from 'node:test';
import assert from 'node:assert/strict';
import {radarNewsPageRoutes} from '../radar-news-pages-v1.js';
test('newsroom starts shell and DB reads concurrently, preserves published copy and links',async()=>{
 const old=globalThis.fetch;let releaseShell,queryStarted=false;
 const shellReady=new Promise(resolve=>{releaseShell=resolve});
 globalThis.fetch=async()=>{await shellReady;return new Response('<html><head></head><body><main>Shell</main></body></html>')};
 const content={destinations:['medicine_news'],seo:{slug:'medicine-news/fixture',title:'Fixture',description:'Original summary'},headline:'Fixture',article_markdown:'Original copy with [internal link](/treatment-centre) and [bad](javascript:alert).'};
 const env={DB:{prepare(){return{async all(){queryStarted=true;releaseShell();return{results:[{id:1,headline:'Fixture',content_package_json:JSON.stringify(content),source_evidence_json:'[]',first_published_at:'2026-09-01T09:00:00Z'}]}}}}}};
 try{
  const response=await radarNewsPageRoutes(new Request('https://shiftsometimber.co.uk/medicine-news/fixture'),env);
  assert(queryStarted);assert.equal(response.status,200);
  assert.match(response.headers.get('server-timing'),/^news_shell;dur=[\d.]+, news_db;dur=[\d.]+$/);
  const html=await response.text();assert.match(html,/Original copy with <a href="\/treatment-centre">internal link<\/a>/);assert.doesNotMatch(html,/href="javascript:/);
 }finally{releaseShell();globalThis.fetch=old}
});
