import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {ANSWER_DEPTH_ADDITIONS,ANSWER_DEPTH_STYLE,answerDepthRequest,improveAnswerDepth,withAnswerDepthSeo,wrapAnswerDepthWorker} from '../public-seo-answer-depth.mjs';
const htmlFor=d=>'<!doctype html><html><head><title>Original</title><script type="application/ld+json">{"@type":"WebPage"}</script></head><body><header>Navigation</header><main><h1>Original title</h1><p>Existing safety information</p><section><h2>'+d.anchor+'</h2><p>Original section</p></section></main><footer>Footer</footer></body></html>';
test('all eight exact additions preserve every original byte and are idempotent',()=>{
 assert.equal(ANSWER_DEPTH_ADDITIONS.length,8);
 for(const d of ANSWER_DEPTH_ADDITIONS){
  assert.equal(crypto.createHash('sha256').update(d.html).digest('hex'),d.sha256);
  const before=htmlFor(d),after=improveAnswerDepth(before,d.path);
  assert.equal(after.split(d.html).length-1,1);
  assert.equal(after.replace('\n'+d.html+'\n','').replace(ANSWER_DEPTH_STYLE,''),before);
  assert.equal(improveAnswerDepth(after,d.path),after);
 }
});
test('unmatched routes and missing, ambiguous or out-of-main anchors stay unchanged',()=>{
 const d=ANSWER_DEPTH_ADDITIONS[0],before=htmlFor(d);
 for(const path of ['/','/start-here','/mental-health/urgent-mental-health-help','/guides/retatrutide-uk-guide','/articles/wegovy-side-effects-timeline','/v1/me','/member/dashboard'])assert.equal(improveAnswerDepth(before,path),before);
 for(const html of [before.replace(d.anchor,'Different heading'),before.replace('</main>','<h2>'+d.anchor+'</h2></main>'),before.replace('<main>','<aside>').replace('</main>','</aside>')])assert.equal(improveAnswerDepth(html,d.path),html);
});
test('conditional requests refresh only selected owners, retaining identity and auth headers',()=>{
 const headers={'if-none-match':'old','if-modified-since':'yesterday',cookie:'session=test',authorization:'Bearer test'};
 const r=new Request('https://shiftsometimber.co.uk/mounjaro',{headers}),next=answerDepthRequest(r);
 assert.equal(next.headers.has('if-none-match'),false);assert.equal(next.headers.has('if-modified-since'),false);
 assert.equal(next.headers.get('cookie'),r.headers.get('cookie'));assert.equal(next.headers.get('authorization'),r.headers.get('authorization'));
 const other=new Request('https://shiftsometimber.co.uk/member/dashboard',{headers});assert.equal(answerDepthRequest(other),other);
});
test('only successful public HTML GETs are changed, and representation headers are refreshed',async()=>{
 const d=ANSWER_DEPTH_ADDITIONS[0],r=new Request('https://shiftsometimber.co.uk'+d.path);
 const headers={'content-type':'text/html','etag':'old','content-length':'1','content-encoding':'gzip','cache-control':'private, max-age=60','content-security-policy':"default-src 'self'",'set-cookie':'kept=1'};
 const out=await withAnswerDepthSeo(new Response(htmlFor(d),{headers}),r);
 assert((await out.text()).includes(d.html));for(const k of ['etag','content-length','content-encoding'])assert.equal(out.headers.has(k),false);
 assert.equal(out.headers.get('content-security-policy'),headers['content-security-policy']);assert.equal(out.headers.get('set-cookie'),'kept=1');assert.equal(out.headers.get('cache-control'),'private, no-cache');
 for(const status of [401,404,500]){const response=new Response('unchanged',{status,headers});assert.equal(await withAnswerDepthSeo(response,r),response);}
 const json=new Response('{}',{headers:{'content-type':'application/json'}});assert.equal(await withAnswerDepthSeo(json,r),json);
 const post=new Request(r,{method:'POST'}),response=new Response(htmlFor(d),{headers});assert.equal(await withAnswerDepthSeo(response,post),response);
 const head=await withAnswerDepthSeo(new Response(null,{headers}),new Request(r,{method:'HEAD'}));assert.equal(head.body,null);
});
test('outer worker wrapper covers early returns and keeps scheduled and other handlers',async()=>{
 const d=ANSWER_DEPTH_ADDITIONS[2];const scheduled=()=>42;const queue=()=>17;let calls=0;
 const original={scheduled,queue,async fetch(request,env,ctx){calls++;assert.equal(this,original);assert.equal(env.test,true);assert.equal(ctx.test,true);return new Response(htmlFor(d),{headers:{'content-type':'text/html'}});}};
 const wrapped=wrapAnswerDepthWorker(original);assert.equal(wrapped.scheduled,scheduled);assert.equal(wrapped.queue,queue);
 const out=await wrapped.fetch(new Request('https://shiftsometimber.co.uk'+d.path),{test:true},{test:true});assert((await out.text()).includes(d.html));assert.equal(calls,1);
});
if(process.env.SST_ANSWER_DEPTH_BASELINE){
 const pages=JSON.parse(fs.readFileSync(process.env.SST_ANSWER_DEPTH_BASELINE,'utf8'));
 test('current production captures have unique usable anchors and exact approved copy',()=>{
  for(const d of ANSWER_DEPTH_ADDITIONS){const page=pages.find(x=>x.path===d.path);assert.equal(page.status,200);const after=improveAnswerDepth(page.html,d.path);assert.equal(after.split(d.html).length-1,1);assert.equal(after.replace('\n'+d.html+'\n','').replace(ANSWER_DEPTH_STYLE,''),page.html);}
  for(const page of pages.filter(x=>!ANSWER_DEPTH_ADDITIONS.some(d=>d.path===x.path)))assert.equal(improveAnswerDepth(page.html,page.path),page.html);
 });
}
test('independent entry forwards production requests and confines layout harness to preview host',async()=>{
 const {default:entry}=await import('../public-answers-entry.mjs');let seen=[];
 const env={CORE:{fetch:async request=>{seen.push(request);return new Response('core',{headers:{'content-type':'text/plain'}});}}};
 const request=new Request('https://shiftsometimber.co.uk/__answer-depth-preview?path=/mounjaro',{headers:{cookie:'session=test'}});
 assert.equal(await (await entry.fetch(request,env)).text(),'core');assert.equal(seen[0].url,request.url);
 const preview=await entry.fetch(new Request('https://shift-public-answers.matobrien.workers.dev/__answer-depth-preview?path=/mounjaro&width=390'),env);
 assert.equal(preview.headers.get('x-robots-tag'),'noindex');assert((await preview.text()).includes('width:390px'));
 await entry.fetch(new Request('https://shift-public-answers.matobrien.workers.dev/mounjaro?qa=1',{headers:{cookie:'session=test'}}),env);
 assert.equal(seen[1].url,'https://shiftsometimber.co.uk/mounjaro?qa=1');assert.equal(seen[1].headers.get('cookie'),'session=test');
});
