import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,runInNewContext} from 'node:vm';
import {applySharedFooter,withSharedFooter,approvedFooter,approvedFooterStyles,legacyInstallStrip} from '../shared-footer.mjs';
import {serviceWorker} from '../my-timber-pwa/service-worker.mjs';
const old='<footer class="site-footer"><p>Old footer</p></footer>';
const page=(footer=old)=>'<html><head><title>Original</title></head><body><main><form id="real"><input name="note" value="Retain me"></form></main>'+footer+'</body></html>';
const count=(s,needle)=>s.split(needle).length-1;
test('canonical HTML and approved CSS exactly match the owner-approved homepage',()=>{
 const source=readFileSync(new URL('../home-compact-footer.mjs',import.meta.url),'utf8');
 for(const [name,value] of [['footer',approvedFooter],['footerCSS',approvedFooterStyles]])assert.equal(value,JSON.parse(source.match(new RegExp('^const '+name+'=(.*);$','m'))[1]));
});
test('all customer routes, including auth, nested tools, app review and error pages receive one identical footer',async()=>{
 for(const path of ['/','/programme','/articles/example','/member-login','/member-register','/member/dashboard?view=app','/member/grub?app_panel=1','/member/fit','/member/settings','/account-deletion','/missing-page'])for(const status of [200,404,503]){
  const r=await withSharedFooter(new Request('https://shiftsometimber.co.uk'+path),new Response(page(),{status,headers:{'Content-Type':'text/html','Set-Cookie':'unchanged=1; Secure','Content-Security-Policy':"default-src 'self'",ETag:'old','Content-Length':'5','Content-Encoding':'gzip'}}));
  const html=await r.text();assert.equal(r.status,status);assert.equal(count(html,approvedFooter),1);assert.equal(count(html,approvedFooterStyles),1);
  assert(html.includes('<form id="real"><input name="note" value="Retain me"></form>'));assert.equal(r.headers.get('Set-Cookie'),'unchanged=1; Secure');assert.equal(r.headers.get('Content-Security-Policy'),"default-src 'self'");
  for(const k of ['ETag','Content-Length','Content-Encoding'])assert.equal(r.headers.get(k),null);assert.equal(r.headers.get('Cache-Control'),'no-store');
 }
});
test('missing and duplicate site footers converge without deleting contextual article footers',()=>{
 const input=page(old+old+'<article><footer class="byline">Author details</footer></article>');const out=applySharedFooter(input);
 assert.equal(count(out,approvedFooter),1);assert(out.includes('<footer class="byline">Author details</footer>'));assert.equal(count(applySharedFooter(page('')),approvedFooter),1);
});
test('replacement is idempotent and superseded footer CSS is removed without changing page/header styles',()=>{
 const input=page().replace('</head>','<style id="sst-cream-footer-preview">old</style><style data-shared-footer-dependency>old</style><style id="page-style">keep</style></head>');
 const out=applySharedFooter(input);assert.equal(applySharedFooter(out),out);assert(!out.includes('sst-cream-footer-preview'));assert(!out.includes('data-shared-footer-dependency'));assert(out.includes('<style id="page-style">keep</style>'));
});
test('misplaced legacy PWA strip moves from a medicine card into the site footer without changing the card',()=>{
 const card='<section class="medicine"><h2>Unchanged medicine</h2><footer><a href="/medicine-source">Evidence</a>'+legacyInstallStrip+'</footer></section>';
 const out=applySharedFooter(page().replace('</main>',card+'</main>'));
 assert(out.includes(card.replace(legacyInstallStrip,'')));assert.equal(count(out,legacyInstallStrip),1);assert.equal(applySharedFooter(out),out);
});
test('API/HQ, non-HTML, POST and HEAD are untouched',async()=>{
 for(const [path,method,type] of [['/v1/x','GET','text/html'],['/hq/x','GET','text/html'],['/assets/style.css','GET','text/css'],['/contact','POST','text/html'],['/','HEAD','text/html']]){const r=new Response(page(),{headers:{'Content-Type':type}});assert.equal(await withSharedFooter(new Request('https://shiftsometimber.co.uk'+path,{method}),r),r);}
 assert.equal(applySharedFooter('<p>fragment</p>'),'<p>fragment</p>');
});
test('generated PWA offline response includes the same footer and does not cache member data',async()=>{
 new Script(serviceWorker);const listeners={};runInNewContext(serviceWorker,{self:{addEventListener:(name,fn)=>listeners[name]=fn,location:{origin:'https://shiftsometimber.co.uk'}},URL,Response,fetch:async()=>{throw Error('offline')}});
 let result;listeners.fetch({request:new Request('https://shiftsometimber.co.uk/member/dashboard',{method:'GET'}),respondWith:p=>result=p});
 // Request.mode is read-only; use a navigation request descriptor.
 listeners.fetch({request:{url:'https://shiftsometimber.co.uk/member/dashboard',method:'GET',mode:'navigate'},respondWith:p=>result=p});
 const r=await result,html=await r.text();assert.equal(r.status,503);assert(html.includes(approvedFooter));assert(html.includes(approvedFooterStyles));assert(!serviceWorker.includes('caches.open'));
});
test('final Worker integration wraps both normal and early public HTML routes',()=>{
 const source=readFileSync(new URL('../worker-entry-v6.js',import.meta.url),'utf8');assert(source.includes('if(appStorePublic)return withSharedFooter(request,appStorePublic);'));assert(source.includes('return withPublicSeoCloseout(await withSharedFooter(request,await withGrowthPublicCopy('));
});
