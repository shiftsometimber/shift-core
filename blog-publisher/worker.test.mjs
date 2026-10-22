import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import worker,{handleRequest,resolveOwner,mergeCatalogue,mergeSitemap} from './worker.mjs';
import {select} from './knowledge-v20261022/page.mjs';
function database(){
 const sqlite=new DatabaseSync(':memory:');
 return {sqlite,prepare(sql){let args=[];return {bind(...x){args=x;return this},async run(){const r=sqlite.prepare(sql).run(...args);return {success:true,meta:{changes:Number(r.changes)}}},async first(){return sqlite.prepare(sql).get(...args)||null},async all(){return {results:sqlite.prepare(sql).all(...args)}}}}};
}
test('owner identity comes from the existing HQ service and requires owner role',async()=>{
 let called=0;
 const request=new Request('https://api.shiftsometimber.co.uk/v1/hq/blog-contributors/console',{headers:{Cookie:'test-cookie',Authorization:'Bearer attacker','X-Blog-Staging-Fixture-Owner':'true'}});
 const env={CORE:{async fetch(r){called++;assert.equal(r.url,'https://api.shiftsometimber.co.uk/v1/hq/me');assert.equal(r.headers.get('Cookie'),'test-cookie');assert.equal(r.headers.has('Authorization'),false);assert.equal(r.headers.has('X-Blog-Staging-Fixture-Owner'),false);return Response.json({user:{id:12,role:'member'}})}}};
 assert.equal(await resolveOwner(request,env),null);
 env.CORE.fetch=async()=>Response.json({user:{id:1,role:'owner'}});
 assert.deepEqual(await resolveOwner(request,env),{id:1,role:'owner'});
 assert.equal(await resolveOwner(new Request(request.url),env),null);
 assert.equal(called,1);
});
test('production ignores fixture-owner and clock headers; other CMS routes are unavailable',async()=>{
 const env={BLOG_CONTRIBUTOR_ENABLED:'true',DB:database()};
 try{
  for(const p of ['/v1/hq/users','/v1/settings','/','/member/dashboard']){
   const r=await worker.fetch(new Request('https://api.shiftsometimber.co.uk'+p,{headers:{'X-Blog-Staging-Fixture-Owner':'true'}}),env,{});
   assert.equal(r.status,404);
  }
  const r=await worker.fetch(new Request('https://api.shiftsometimber.co.uk/v1/hq/blog-contributors/console',{headers:{'X-Blog-Staging-Fixture-Owner':'true','X-Blog-Staging-Clock':'2026-10-24T11:00:00Z'}}),env,{});
  assert.equal(r.status,403);
  const wrong=await worker.fetch(new Request('https://api.shiftsometimber.co.uk/v1/integrations/blog-articles',{headers:{Authorization:'Bearer invalid'}}),env,{});
  assert.equal(wrong.status,401);
 }finally{env.DB.sqlite.close()}
});
test('existing articles delegate to Core with the request preserved; empty listing delegates to Knowledge',async()=>{
 const requests=[],env={CORE:{fetch(r){requests.push(r);return new Response('original article',{headers:{'X-Existing':'yes'}})}},KNOWLEDGE:{fetch(){return new Response('current Knowledge')}}};
 const req=new Request('https://shiftsometimber.co.uk/articles/existing-article?x=1');
 const response=await handleRequest(req,env,{});
 assert.equal(await response.text(),'original article');assert.equal(requests[0],req);assert.equal(response.headers.get('X-Existing'),'yes');
 assert.equal(await (await handleRequest(new Request('https://shiftsometimber.co.uk/explore-knowledge'),env,{})).text(),'current Knowledge');
 assert.equal((await handleRequest(new Request(req,{method:'POST'}),env,{})).status,405);
});
test('new blogs merge into the live catalogue with filtering, dates, sorting and refresh deduplication',()=>{
 const rows=[{title:'Walking questions',slug:'walking-questions',summary:'Questions about movement',category:'fitness',publish_at:'2026-10-26T11:00:00Z'}];
 const merged=mergeCatalogue([{title:'Old title',href:'/articles/walking-questions'},{title:'Existing food',description:'Meals',topic:'nutrition',type:'Article',href:'/articles/food',date:'Published 20 Oct 2026'}],rows);
 assert.equal(merged.length,2);
 const chosen=select(merged,new URL('https://shiftsometimber.co.uk/explore-knowledge?q=walking&topic=movement&type=Article&sort=newest'));
 assert.equal(chosen.selected.length,1);assert.equal(chosen.selected[0].date,'Published 26 Oct 2026');
 assert.equal(select(merged,new URL('https://shiftsometimber.co.uk/explore-knowledge?topic=food')).selected[0].title,'Existing food');
});
test('sitemap preserves all existing URLs and replaces a refreshed URL once',()=>{
 const original='<urlset><url><loc>https://shiftsometimber.co.uk/</loc></url><url><loc>https://shiftsometimber.co.uk/articles/new-post</loc><lastmod>2020-01-01</lastmod></url></urlset>';
 const rows=[{slug:'new-post',publish_at:'2026-10-22',updated_at:'2026-10-23T11:00:00Z'},{slug:'second-post',publish_at:'2026-10-24'}];
 const merged=mergeSitemap(original,rows);
 assert.ok(merged.includes('<loc>https://shiftsometimber.co.uk/</loc>'));assert.equal(merged.split('/articles/new-post</loc>').length,2);
 assert.ok(merged.includes('<lastmod>2026-10-23</lastmod>'));assert.ok(merged.includes('/articles/second-post</loc>'));
 assert.equal(mergeSitemap(merged,rows),merged);
});
