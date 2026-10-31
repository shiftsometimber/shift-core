import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {memberExperienceRoutes,memberExperienceEntry} from '../entry.mjs';
import {memberClient} from '../client.mjs';
import {foodLogRuntime} from '../food-log-client.mjs';
const env={MEMBER_EXPERIENCE_V1_ENABLED:'true',MEMBER_SESSION_REVIEW_ONLY:true};
test('the existing presentation script retains its exact source and network-free boundary',async()=>{
 const response=memberExperienceRoutes(new Request('https://shiftsometimber.co.uk/assets/member-experience/v1.mjs'),env);
 assert.equal(response.status,200);const body=await response.text();assert.equal(body,memberClient);assert.doesNotMatch(body,/\bfetch\s*\(|localStorage|sessionStorage|__name\b/);
});
test('food summaries have their own private read-only asset and need no browser persistence',async()=>{
 const url='https://shiftsometimber.co.uk/assets/member-experience/food-log.mjs';
 const response=memberExperienceRoutes(new Request(url),env);assert.equal(response.status,200);assert.match(response.headers.get('Cache-Control'),/no-store/);assert.match(response.headers.get('X-Robots-Tag'),/noindex/);
 const source=await response.text();assert.equal(source,foodLogRuntime);new vm.Script(source);
 assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB|__name\b|\bmethod\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/);
 assert.match(source,/\/v1\/grub\/eaten/);assert.match(source,/\/v1\/me/);
 const head=memberExperienceRoutes(new Request(url,{method:'HEAD'}),env);assert.equal(await head.text(),'');
});
test('the authoritative dashboard and Grub pages load the same summary asset exactly once',async()=>{
 for(const page of ['dashboard','grub']){
  const request=new Request('https://shiftsometimber.co.uk/member/'+page);
  const html='<!doctype html><html><head><title>Fixture</title></head><body><main><section id="panel-today"></section><section id="panel-journey"></section></main></body></html>';
  const response=await memberExperienceEntry(request,env,new Response(html,{headers:{'Content-Type':'text/html'}}));
  const result=await response.text();assert.equal((result.match(/src="\/assets\/member-experience\/food-log\.mjs"/g)||[]).length,1);
  assert.match(result,/data-member-experience="v1"/);
 }
});
