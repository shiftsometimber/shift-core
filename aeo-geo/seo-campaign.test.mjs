import {test} from 'node:test';
import assert from 'node:assert/strict';
import {continuityAliasResponse,programmePublicLibraryLinks,withAeoGeo} from './delivery.mjs';
import {enhancePublicHtml} from './schema.mjs';
const origin='https://shiftsometimber.co.uk';
const oldAlias='/when-the-clinic-goes-quiet';
const week='<section class="pv-week-section" aria-labelledby="pv-week-title"><div class="pv-wrap"><h2 id="pv-week-title">Your first week,<br><em>made simpler.</em></h2><div class="pv-feature-grid">'+
 '<article><a href="https://shiftsometimber.co.uk/member/grub" target="_blank" rel="noopener"><img src="/assets/meal.jpg" alt="A home-cooked dinner"><h3>Simple food.</h3><p>Find recipes and food ideas that work around your time and budget.</p><span class="pv-text-link">Explore Grub <b aria-hidden="true">→</b></span></a></article>'+
 '<article><a href="https://shiftsometimber.co.uk/member/fit" target="_blank" rel="noopener"><h3>Movement that fits.</h3><p>Explore options for your ability, available time and equipment.</p><span class="pv-text-link">Explore Fit <b aria-hidden="true">→</b></span></a></article>'+
 '<article><a href="https://shiftsometimber.co.uk/member/dashboard#journey" target="_blank" rel="noopener"><h3>A little structure.</h3><span class="pv-text-link">Open My Timber</span></a></article></div></div></section>';
const before='<!doctype html><html><head><title>The Shift Programme</title><link rel="canonical" href="'+origin+'/programme"></head><body><header>KEEP HEADER</header><main><h1>A plan for real life.</h1>'+week+'<section>KEEP OTHER CONTENT</section></main><footer>KEEP FOOTER</footer></body></html>';
const noCatalogue=()=>{throw Error('No catalogue/database access expected');};
const shell={header:'',footer:''};

test('legacy continuity variants go straight to one fixed HTTPS canonical destination',()=>{
 for(const method of ['GET','HEAD'])for(const host of ['shiftsometimber.co.uk','www.shiftsometimber.co.uk'])for(const protocol of ['http:','https:'])for(const suffix of ['','/','.html','.html/']){
  const r=continuityAliasResponse(new Request(protocol+'//'+host+oldAlias+suffix+'?source=guide&next=https%3A%2F%2Fother.example',{method}));
  assert.equal(r.status,301);assert.equal(r.headers.get('Location'),origin+'/clinic-gone-quiet?source=guide&next=https%3A%2F%2Fother.example');
  assert.equal(r.body,null);assert.equal(r.headers.get('Cache-Control'),'public, max-age=300');
 }
});
test('lookalikes, private paths, foreign hosts and write methods never become redirects',()=>{
 for(const path of ['/clinic-gone-quiet',oldAlias+'-extra','/member'+oldAlias,'/api'+oldAlias,'/checkout','/'])assert.equal(continuityAliasResponse(new Request(origin+path)),null);
 for(const host of ['other.example','shiftsometimber.co.uk.other.example'])assert.equal(continuityAliasResponse(new Request('https://'+host+oldAlias)),null);
 for(const method of ['POST','PUT','PATCH','DELETE','OPTIONS'])assert.equal(continuityAliasResponse(new Request(origin+oldAlias,{method})),null);
});
test('the integrated alias does not invoke retained origin, catalogue, shell or account code',async()=>{
 let calls=0;const worker=withAeoGeo({fetch(){calls++;throw Error('Unexpected original request');}},{catalogue:noCatalogue,shell});
 const r=await worker.fetch(new Request('http://www.shiftsometimber.co.uk'+oldAlias));
 assert.equal(r.status,301);assert.equal(r.headers.get('Location'),origin+'/clinic-gone-quiet');assert.equal(calls,0);
});
test('Programme changes only the two public destinations and their link labels',()=>{
 const after=programmePublicLibraryLinks(before,'/programme');assert.notEqual(after,before);
 const expected=before.replace('href="https://shiftsometimber.co.uk/member/grub" target="_blank" rel="noopener"','href="/recipes"')
  .replace('href="https://shiftsometimber.co.uk/member/fit" target="_blank" rel="noopener"','href="/exercises"')
  .replace('<span class="pv-text-link">Explore Grub ','<span class="pv-text-link">Browse public recipes ')
  .replace('<span class="pv-text-link">Explore Fit ','<span class="pv-text-link">Browse movement guides ');
 assert.equal(after,expected);assert(after.includes('href="https://shiftsometimber.co.uk/member/dashboard#journey" target="_blank" rel="noopener"'));
 assert.equal(programmePublicLibraryLinks(after,'/programme'),after);
 for(const path of ['/','/member/dashboard','/recipes/meal','/provider-switch'])assert.equal(programmePublicLibraryLinks(before,path),before);
});
test('editorial drift, duplicate sections or an incomplete previous edit preserve the whole source',()=>{
 for(const value of [before.replace('Explore Fit ','Try Fit '),before.replace('</main>',week+'</main>'),before.replace('https://shiftsometimber.co.uk/member/grub','/recipes'),before.replace('pv-week-title','renamed-week-title'),before.replace('<head>','<head><meta name="robots" content="noindex,follow">')])assert.equal(programmePublicLibraryLinks(value,'/programme'),value);
});
test('Programme response keeps policy headers and canonical while dropping stale body validators',async()=>{
 const headers={'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','Set-Cookie':'existing=kept; Secure; HttpOnly','ETag':'old','Content-Length':String(before.length),'Content-Encoding':'gzip'};
 const worker=withAeoGeo({fetch:()=>new Response(before,{headers})},{catalogue:noCatalogue,shell});
 const r=await worker.fetch(new Request(origin+'/programme'));
 assert.equal(await r.text(),programmePublicLibraryLinks(enhancePublicHtml(before,'/programme'),'/programme'));
 assert.equal(r.headers.get('Cache-Control'),'private, no-store');assert.equal(r.headers.get('Set-Cookie'),headers['Set-Cookie']);
 for(const key of ['ETag','Content-Length','Content-Encoding'])assert.equal(r.headers.get(key),null);
});
test('protected requests and failed responses retain the original response object',async()=>{
 const original=new Response('UNCHANGED',{status:401,headers:{'Set-Cookie':'session=kept; Secure','Cache-Control':'no-store'}});
 const worker=withAeoGeo({fetch:()=>original},{catalogue:noCatalogue,shell});
 for(const [path,method] of [['/member/dashboard','GET'],['/api/orders','GET'],['/checkout','GET'],['/programme','POST'],[oldAlias,'POST'],['/programme','GET']])assert.equal(await worker.fetch(new Request(origin+path,{method})),original);
});
