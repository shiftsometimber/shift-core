import assert from 'node:assert/strict';
import {test} from 'node:test';
import {transform,wrap,version,mainHTML} from './runtime.mjs';
const hero='<section data-next-hero="continuity"><figure><img src="/existing.webp" alt="Current approved photograph"></figure><h1>Clinic gone quiet?<br>Keep your story together.</h1><a href="#continuity-now-title">Find your next step</a></section>';
const shell='<!doctype html><html><head><title>Existing title</title><script type="application/ld+json">{"url":"https://shiftsometimber.co.uk/clinic-gone-quiet"}</script></head><body><header>Existing navigation</header><main class="continuity-page qpp" data-continuity-c1="existing" id="main-content">'+hero+'<section><h2>Old body</h2><p>Superseded repeated introduction</p></section></main><footer>Existing footer</footer><script src="/unchanged.js"></script></body></html>';
test('updates only the requested body and style, retaining approved hero and surrounding document',()=>{
 const out=transform(shell).html;
 assert(out.includes(hero));assert(!out.includes('Superseded repeated introduction'));
 assert.equal(out.slice(out.indexOf('</main>')),shell.slice(shell.indexOf('</main>')));
 assert.equal(out.slice(0,out.indexOf('<style data-continuity-review-style')),shell.slice(0,shell.indexOf('</head>')));
 assert(out.includes('<header>Existing navigation</header>'));assert(out.includes('data-continuity-review="'+version+'"'));
 assert.equal((out.match(/<h1\b/g)||[]).length,1);
 assert.equal((out.match(/data-continuity-choice=/g)||[]).length,6);
 for(const id of ['continuity-now-title','cr-contact-note','cr-urgent-title'])assert(out.includes('id="'+id+'"'));
});
test('transform is idempotent and ignores unrelated paths',()=>{
 const once=transform(shell).html;assert.deepEqual(transform(once),{html:once,changed:false});
 assert.deepEqual(transform(shell,'/provider-switch'),{html:shell,changed:false});
});
test('keeps page structured data aligned with the retained hero and actual content review',()=>{
 const value={'@graph':[{'@type':'WebPage',url:'https://shiftsometimber.co.uk/clinic-gone-quiet',headline:'Previous headline',datePublished:'2026-09-17',dateModified:'2026-10-09'},{'@type':'Organization',name:'Unchanged organisation'}]};
 const source=shell.replace('{"url":"https://shiftsometimber.co.uk/clinic-gone-quiet"}',JSON.stringify(value));
 const output=transform(source).html;const graph=JSON.parse(output.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
 assert.equal(graph[0].headline,'Clinic gone quiet? Keep your story together.');assert.equal(graph[0].dateModified,'2026-10-31');assert.equal(graph[0].datePublished,'2026-09-17');assert.deepEqual(graph[1],value['@graph'][1]);
});
test('fails closed when approved hero structure is missing',async()=>{
 const broken=shell.replace('data-next-hero="continuity"','data-next-hero="different"');
 assert.throws(()=>transform(broken),/approved Continuity hero/);
 const original={fetch:async()=>new Response(broken,{headers:{'Content-Type':'text/html'}})};
 const res=await wrap(original).fetch(new Request('https://shiftsometimber.co.uk/clinic-gone-quiet'));
 assert.equal(await res.text(),broken);assert.equal(res.headers.get('X-Shift-Continuity-Review'),null);
});
test('preserves non-targeted methods, paths and original lifecycle handlers',async()=>{
 const scheduled=()=>{},calls=[];
 const original={scheduled,fetch:async req=>{calls.push(req);return new Response('untouched',{status:202,headers:{'X-Existing':'yes'}})}};
 const wrapped=wrap(original,['/clinic-gone-quiet']);assert.equal(wrapped.scheduled,scheduled);
 for(const [path,method]of [['/member/dashboard','GET'],['/clinic-gone-quiet','POST'],['/clinic-gone-quiet?existing=1','GET']]){
  const req=new Request('https://shiftsometimber.co.uk'+path,{method}),res=await wrapped.fetch(req);assert.equal(calls.at(-1),req);assert.equal(res.status,202);assert.equal(await res.text(),'untouched');
 }
});
test('transforms only successful HTML, preserves canonical redirects and strips stale body validators',async()=>{
 const wrapped=wrap({fetch:async()=>new Response(shell,{headers:{'Content-Type':'text/html','ETag':'old','Content-Length':'12','X-Existing':'yes'}})});
 const response=await wrapped.fetch(new Request('https://shiftsometimber.co.uk/clinic-gone-quiet'));
 assert.equal(response.headers.get('X-Existing'),'yes');assert.equal(response.headers.get('ETag'),null);assert.equal(response.headers.get('Content-Length'),null);assert.equal(response.headers.get('X-Shift-Continuity-Review'),version);
 assert((await response.text()).includes('What’s changed for you?'));
 const redirect=Response.redirect('https://shiftsometimber.co.uk/clinic-gone-quiet',301);
 const res=await wrap({fetch:async()=>redirect}).fetch(new Request('https://shiftsometimber.co.uk/clinic-gone-quiet/'));
 assert.equal(res,redirect);
});
test('HEAD returns matching headers and no body',async()=>{
 const methods=[];const wrapped=wrap({fetch:async req=>{methods.push(req.method);return new Response(shell,{headers:{'Content-Type':'text/html'}})}});
 const head=await wrapped.fetch(new Request('https://shiftsometimber.co.uk/clinic-gone-quiet',{method:'HEAD'}));assert.equal(head.headers.get('X-Shift-Continuity-Review'),version);assert.equal(await head.text(),'');assert.deepEqual(methods,['GET']);
});
test('source-drift fallback returns the original stream and its original headers',async()=>{
 const upstream=new Response('future client source',{headers:{'Content-Type':'application/javascript','Content-Encoding':'gzip','ETag':'original'}});
 const res=await wrap({fetch:async()=>upstream}).fetch(new Request('https://shiftsometimber.co.uk/my-timber-v11.js?v=1'));
 assert.equal(res,upstream);assert.equal(res.headers.get('Content-Encoding'),'gzip');assert.equal(res.headers.get('ETag'),'original');assert.equal(await res.text(),'future client source');
});
test('every new same-page action has a unique real target, and no clinical or community delivery is invented',()=>{
 const out=mainHTML(transform(shell).html),ids=[...out.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const m of out.matchAll(/\bhref="#([^"]+)"/g))assert(ids.includes(m[1]),'Broken local target '+m[1]);
 assert(!out.includes('24/7'));assert(!out.includes('within one working day'));assert(!out.includes('clinically proven'));assert(out.includes('Illustrative example — not a member result.'));assert(out.includes('not monitored clinical messages'));
});
