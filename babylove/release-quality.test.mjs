import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {articleHTML,dynamicBabyLovePublicRoute,representativeImage} from './dynamic-public.mjs';
import {ARTICLE as wegovy,babyLovePublicRoute} from './public-article.mjs';
import {ARTICLE as oral,oralPublicRoute} from './oral-public.mjs';
import {PUBLIC_HEADERS,withArticleResponsePolicy} from './response-policy.mjs';
const image='https://csuxjmfbwmkxiegfpljm.supabase.co/storage/v1/object/public/blog-images/organization-55073/fixture.jpeg';
const row={title:'Future article & <title>',slug:'future-article',summary:'Existing approved description.',author:'SHIFT Team',body:'## Original copy\n\n![Original image]('+image+')\n\nUnchanged copy.\n\n![Second image]('+image+')',status:'published',publish_at:'2026-09-21T16:25:27.795Z'};
const db=row=>({DB:{prepare(){return{bind(){return this},first:async()=>row}}}});
const getSchema=html=>JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);

test('future automatic articles inherit complete sharing and honest schema without content/date edits',()=>{
 const html=articleHTML(row),schema=getSchema(html),lead=representativeImage(row);
 for(const field of ['og:image','twitter:title','twitter:description','twitter:image']){
  assert.equal((html.match(new RegExp('(?:name|property)="'+field+'"','g'))||[]).length,1);
  assert.match(html,new RegExp('(?:name|property)="'+field+'" content="[^"]+"'));
 }
 assert.equal(schema.image,lead.url);assert.equal(schema.datePublished,row.publish_at);
 assert.equal(schema.dateModified,row.publish_at);assert.equal(schema.headline,row.title);
 assert.equal(schema.publisher.logo.url,'https://shiftsometimber.co.uk/assets/shift-wordmark.png');
 assert.equal(schema.author.logo.url,schema.publisher.logo.url);
 assert.match(html,/Unchanged copy\./);assert.match(html,/loading="eager" fetchpriority="high"/);
 assert.equal((html.match(/loading="eager"/g)||[]).length,1);
 assert.equal((html.match(/loading="lazy"/g)||[]).length,1);
 for(const script of ['analytics-bootstrap-v1.js','consent-v4a.js','analytics-events-v31b.js'])assert.equal(html.split(script).length-1,1);
});
test('missing representative image is an advisory, never disguised with an Article logo/image',()=>{
 const html=articleHTML({...row,body:'Original approved copy without an image.'});
 assert.equal(getSchema(html).image,undefined);
 assert.match(html,/twitter:image" content="https:\/\/shiftsometimber.co.uk\/assets\/og-default.jpg/);
 for(const url of ['https://evil.example/x.jpg','https://csuxjmfbwmkxiegfpljm.supabase.co@evil.example/x.jpg','https://user:pass@csuxjmfbwmkxiegfpljm.supabase.co/storage/v1/object/public/blog-images/organization-55073/x.jpg'])assert.equal(representativeImage({...row,body:'![x]('+url+')'}),null);
});
test('all three article renderers use one public header policy for GET and HEAD',async()=>{
 for(const [route,record] of [[babyLovePublicRoute,{...wegovy,decision:'approved',status:'published',publish_at:row.publish_at}],[oralPublicRoute,{...oral,decision:'approved',status:'published',publish_at:row.publish_at}],[dynamicBabyLovePublicRoute,row]]){
  for(const method of ['GET','HEAD']){
   const response=await route(new Request('https://shiftsometimber.co.uk/articles/'+record.slug,{method}),db(record));
   assert.equal(response.status,200);
   for(const [name,value] of Object.entries(PUBLIC_HEADERS))assert.equal(response.headers.get(name),value,name);
   assert.match(response.headers.get('cache-control'),/no-store/);
   if(method==='HEAD')assert.equal(await response.text(),'');
  }
 }
 const wrapped=withArticleResponsePolicy(Response.redirect('https://shiftsometimber.co.uk/',301));
 assert.equal(wrapped.status,301);assert.equal(wrapped.headers.get('location'),'https://shiftsometimber.co.uk/');
});
test('image proxy keeps the fresh publication guard and never forwards credentials or follows redirects',async()=>{
 const old=globalThis.fetch;let calls=0;
 globalThis.fetch=async(url,options)=>{calls++;assert.equal(url,image);assert.equal(options.redirect,'manual');assert.equal(options.headers.Cookie,undefined);assert.equal(options.headers.Authorization,undefined);assert.equal(options.cf,undefined);return new Response('image',{headers:{'Content-Type':'image/jpeg'}})};
 try{
  const request=new Request('https://shiftsometimber.co.uk/articles/future-article/image?src='+encodeURIComponent(image));
  assert.equal((await dynamicBabyLovePublicRoute(request,db(row))).status,200);
  assert.equal(await dynamicBabyLovePublicRoute(request,db(null)),null);assert.equal(calls,1);
 }finally{globalThis.fetch=old}
});
test('publication remains a fresh database check and instrumentation contains no page/user data',async()=>{
 let calls=0;const env={DB:{prepare(){return{bind(){return this},async first(){return ++calls===1?row:null}}}}};
 const request=new Request('https://shiftsometimber.co.uk/articles/future-article');
 const response=await dynamicBabyLovePublicRoute(request,env);
 assert.match(response.headers.get('server-timing'),/^article_db;dur=[\d.]+, article_render;dur=[\d.]+$/);
 assert.equal(await dynamicBabyLovePublicRoute(request,env),null);
});
test('production deploy cannot skip article quality tests',()=>{
 const workflow=readFileSync('.github/workflows/cloudflare-production-promote.yml','utf8');
 const testAt=workflow.indexOf('node --test babylove/*.test.mjs');
 assert(testAt>0&&testAt<workflow.indexOf('npx wrangler deploy --config wrangler.jsonc'));
});
