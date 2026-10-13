import {rootShareHistoricalFile} from '../release/root-share-preview-scope.mjs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PUBLIC_HEADERS} from '../babylove/response-policy.mjs';
import {withPublicResponsePolicy,withPublicResponsePolicyWorker} from '../public-response-policy.mjs';
import {PUBLIC_STYLES,withPublicToolDelivery} from '../public-tool-delivery.mjs';
import {repairTechnicalSitemap,withTechnicalSeo} from '../public-seo-technical.mjs';
import {NOINDEX_SITEMAP_PATHS} from '../public-seo-technical-data.mjs';
import {withMaleObesity} from '../obesity-awareness/production.mjs';
const origin='https://shiftsometimber.co.uk';
const req=(path,method='GET',headers={})=>new Request(origin+path,{method,headers});
const body='<html><head><title>Approved content</title></head><body><main>Approved safety and practical help</main></body></html>';
const html=(text=body,headers={})=>new Response(text,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store',ETag:'approved-body',...headers}});

test('final public GET/HEAD policy restores exact existing headers without changing body, cache or validators',async()=>{
 for(const method of ['GET','HEAD'])for(const path of ['/','/start-here','/male-obesity','/guides/retatrutide-uk-guide','/mental-health/stress-overwhelm']){
  const response=withPublicResponsePolicy(html(method==='HEAD'?null:body),req(path+'?v=12',method));
  for(const [name,value] of Object.entries(PUBLIC_HEADERS))assert.equal(response.headers.get(name),value);
  assert.equal(await response.text(),method==='HEAD'?'':body);
  assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.equal(response.headers.get('ETag'),'approved-body');
 }
});
test('explicit stronger security policies are never overwritten and complete responses retain identity',()=>{
 const response=html(body,{'Content-Security-Policy':"default-src 'none'",'Strict-Transport-Security':'max-age=63072000','Permissions-Policy':'camera=()'});
 const repaired=withPublicResponsePolicy(response,req('/male-obesity'));
 for(const key of ['Content-Security-Policy','Strict-Transport-Security','Permissions-Policy'])assert.equal(repaired.headers.get(key),response.headers.get(key));
 const complete=html(body,PUBLIC_HEADERS);
 assert.equal(withPublicResponsePolicy(complete,req('/male-obesity')),complete);
});
test('members, APIs, HQ, checkout, authentication and account responses remain untouched',()=>{
 for(const path of ['/member/dashboard','/member-login','/v1/me','/api/results','/hq','/admin','/work/account','/auth/login','/checkout','/treatment-order','/my-timber','/my-treatment','/my-journey','/account.html']){
  const response=html();assert.equal(withPublicResponsePolicy(response,req(path)),response,path);
 }
});
test('authenticated/private/cookie-varying responses and nonpublic failures never receive this policy',()=>{
 for(const [headers,request,status] of [
  [{'Cache-Control':'private, no-store'},req('/male-obesity'),200],
  [{'Set-Cookie':'session=synthetic'},req('/male-obesity'),200],
  [{Vary:'Accept-Encoding, Cookie'},req('/male-obesity'),200],
  [{Vary:'authorization'},req('/male-obesity'),200],
  [{Vary:'*'},req('/male-obesity'),200],
  [{},req('/male-obesity','GET',{Authorization:'synthetic'}),200],
  [{},req('/male-obesity','POST'),200],
  [{},new Request('https://other.example/male-obesity'),200],
  [{},req('/male-obesity'),404],
  [{},req('/male-obesity'),503],
  [{'Content-Type':'application/json'},req('/male-obesity'),200]
 ]){
  const response=new Response('preserve',{status,headers:{'Content-Type':'text/html',...headers}});
  assert.equal(withPublicResponsePolicy(response,request),response);
 }
});
test('outer wrapper preserves cron, bindings and context and runs after the obesity adapter',async()=>{
 let calls=0;const scheduled=()=>{},env={synthetic:true},ctx={synthetic:true};
 const core={scheduled,fetch:async(request,e,c)=>{calls++;assert.equal(e,env);assert.equal(c,ctx);return html();}};
 const existing=withMaleObesity(core);
 const wrapped=withPublicResponsePolicyWorker(existing);
 assert.equal(wrapped.scheduled,scheduled);
 const before=await existing.fetch(req('/guides/retatrutide-uk-guide'),env,ctx);
 const after=await wrapped.fetch(req('/guides/retatrutide-uk-guide'),env,ctx);
 assert.equal(await after.text(),await before.text());
 for(const [name,value] of Object.entries(PUBLIC_HEADERS))assert.equal(after.headers.get(name),value);
 assert.equal(calls,2);
});
test('real production source places header policy after the final obesity adapter',()=>{
 const source=rootShareHistoricalFile('shift-coach/worker.mjs',readFileSync('shift-coach/worker.mjs','utf8'));
 assert.match(source,/export default withPublicResponsePolicyWorker\(withMaleObesity\(composedWorker\)\);/);
 assert.match(source,/await core\.scheduled\(controller,env,ctx\)/);
});
test('member stylesheet GET/HEAD/query variants are no-store with bytes and other headers preserved',async()=>{
 assert.equal(PUBLIC_STYLES.size,8);assert(!PUBLIC_STYLES.has('/assets/my-timber-pwa.css'));
 for(const method of ['GET','HEAD'])for(const suffix of ['','?v=12']){
  const response=await withPublicToolDelivery(new Response(method==='HEAD'?null:'approved-css',{headers:{'Content-Type':'text/css; charset=utf-8','Cache-Control':'public, max-age=300',ETag:'css-before','X-Robots-Tag':'noindex, nofollow'}}),req('/assets/my-timber-pwa.css'+suffix,method));
  assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.equal(response.headers.get('ETag'),'css-before');
  assert.equal(response.headers.get('X-Robots-Tag'),'noindex, nofollow');
  assert.equal(await response.text(),method==='HEAD'?'':'approved-css');
 }
});
test('member stylesheet retains the private qualifier and cannot become a public cache path',async()=>{
 const response=await withPublicToolDelivery(new Response('css',{headers:{'Content-Type':'text/css','Cache-Control':'private, max-age=600','Set-Cookie':'session=synthetic',Vary:'Cookie'}}),req('/assets/my-timber-pwa.css','GET',{Authorization:'synthetic'}));
 assert.equal(response.headers.get('Cache-Control'),'private, no-store');
 assert.equal(response.headers.get('Set-Cookie'),'session=synthetic');assert.equal(response.headers.get('Vary'),'Cookie');
});
test('member CSS non-success/non-CSS/foreign-origin/POST responses retain identity',async()=>{
 for(const [request,status,type] of [[req('/assets/my-timber-pwa.css'),404,'text/css'],[req('/assets/my-timber-pwa.css'),200,'text/html'],[req('/assets/my-timber-pwa.css','POST'),200,'text/css'],[new Request('https://other.example/assets/my-timber-pwa.css'),200,'text/css']]){
  const r=new Response('keep',{status,headers:{'Content-Type':type}});assert.equal(await withPublicToolDelivery(r,request),r);
 }
});
const briefing='/medicine-news/retatrutide-fakes-research-is-not-a-treatment-offer';
const guide='/guides/retatrutide-uk-guide';
const entry=(path,host=origin)=>'<url><loc>'+host+path+'</loc><lastmod>2026-10-11</lastmod></url>';
test('sitemap exclusion removes only the exact quarantined briefing and keeps guide, unrelated entries and external hosts',()=>{
 assert(NOINDEX_SITEMAP_PATHS.includes(briefing));
 const kept=[entry(guide),entry('/male-obesity'),entry('/medicine-news/retatrutide-fakes-research-is-not-a-treatment-offer-extra'),entry(briefing,'https://other.example')];
 const original='<urlset>'+entry(briefing)+kept.join('')+'</urlset>';
 assert.equal(repairTechnicalSitemap(original),'<urlset>'+kept.join('')+'</urlset>');
 assert.equal(repairTechnicalSitemap(repairTechnicalSitemap(original)),repairTechnicalSitemap(original));
 const trust=readFileSync('shift-coach/public-trust-repair.mjs','utf8');
 assert(trust.includes("headers.set('X-Robots-Tag','noindex, follow')"));
});
test('existing final adapter serves consistent GET and HEAD sitemaps without reinstating briefing or losing the hub',async()=>{
 const xml='<urlset>'+entry(briefing)+entry(guide)+'</urlset>';
 const core={fetch:async request=>withTechnicalSeo(new Response(xml,{headers:{'Content-Type':'application/xml'}}),request)};
 const worker=withPublicResponsePolicyWorker(withMaleObesity(core));
 for(const method of ['GET','HEAD']){
  const r=await worker.fetch(req('/sitemap.xml',method),{},{});
  assert.equal(r.status,200);const result=await r.text();
  if(method==='HEAD')assert.equal(result,'');
  else{assert(!result.includes(origin+briefing));assert(result.includes(origin+guide));assert(result.includes(origin+'/male-obesity'));}
 }
});

test('all 163 earlier sitemap exclusions and their exact order remain preserved',()=>{
 const prior=NOINDEX_SITEMAP_PATHS.filter(path=>path!==briefing);assert.equal(prior.length,163);
 assert.equal(createHash('sha256').update(JSON.stringify(prior)).digest('hex'),"074803873b60aa76f7f119a72e88d5772db4a685952a7e59d9b00a7eb0fec7ad");
});
