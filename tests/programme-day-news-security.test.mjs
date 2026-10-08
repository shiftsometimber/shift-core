import test from 'node:test';
import assert from 'node:assert/strict';
import {radarNewsPageRoutes} from '../radar-news-pages-v1.js';
import {PUBLIC_HEADERS} from '../babylove/response-policy.mjs';
test('rendered newsroom responses carry the full existing security policy on GET and HEAD, with content and upstream headers retained',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>new Response('<html><head><title>Old</title></head><body><header>Approved header</header><main>Old</main></body></html>',{headers:{'X-Upstream-Proof':'retained'}});
 const row={id:1,headline:'Approved article',reviewed_at:'2026-10-01',content_package_json:JSON.stringify({headline:'Approved article',article_markdown:'Original reviewed paragraph.',seo:{slug:'medicine-news/approved'},destinations:['medicine_news']})};
 const env={DB:{prepare:()=>({all:async()=>({results:[row]})})}};
 try{
  for(const method of ['GET','HEAD'])for(const [path,status] of [['/shift-newsroom',200],['/medicine-news/approved',200],['/medicine-news/missing',404]]){
   const r=await radarNewsPageRoutes(new Request('https://shiftsometimber.co.uk'+path,{method}),env);
   assert.equal(r.status,status);
   for(const [name,value] of Object.entries(PUBLIC_HEADERS))assert.equal(r.headers.get(name),value,path+' '+method+' '+name);
   assert.equal(r.headers.get('x-upstream-proof'),'retained');
   assert.equal(r.headers.get('x-shift-newsroom-renderer'),'radar-ssr-v1');
   assert.match(r.headers.get('server-timing'),/news_shell/);
   const html=await r.text();
   if(method==='HEAD')assert.equal(html,'');
   else {assert.match(html,/<header>Approved header<\/header>/);if(path==='/medicine-news/approved')assert.match(html,/Original reviewed paragraph\./);}
  }
  assert.equal(await radarNewsPageRoutes(new Request('https://shiftsometimber.co.uk/member/dashboard'),env),null);
  assert.equal(await radarNewsPageRoutes(new Request('https://shiftsometimber.co.uk/medicine-news/approved',{method:'POST'}),env),null);
 }finally{globalThis.fetch=original}
});
