import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {memberExperienceEntry,memberExperienceRoutes} from '../entry.mjs';
import {memberReviewRoutes} from '../staging/routes.mjs';

const dashboard=await readFile(new URL('../test-support/dashboard.html',import.meta.url),'utf8');
const request=path=>new Request('https://shiftsometimber.co.uk'+path);
const enabled={MEMBER_EXPERIENCE_V1_ENABLED:'true',WORK_V1_ENABLED:'true'};
const page=html=>new Response(html,{headers:{'Content-Type':'text/html','ETag':'old','Content-Length':'1'}});

test('feature disabled passes through member HTML and routing unchanged',async()=>{
 const response=page(dashboard);assert.equal(await memberExperienceEntry(request('/member/dashboard'),{},response),response);
 assert.equal(memberExperienceRoutes(request('/member/journey'),{}),null);
 assert.equal(memberExperienceRoutes(request('/assets/member-experience/v1.css'),{}),null);
});
test('Journey aliases lead to the real dashboard record with a reversible private redirect',()=>{
 for(const alias of ['/member/journey','/member/journey.html','/member/journey/']){
  const r=memberExperienceRoutes(request(alias),enabled);assert.equal(r.status,302);assert.equal(r.headers.get('Location'),'https://shiftsometimber.co.uk/member/dashboard#journey');assert.match(r.headers.get('Cache-Control'),/no-store/);
 }
 assert.equal(memberExperienceRoutes(new Request('https://shiftsometimber.co.uk/member/journey',{method:'POST'}),enabled),null);
});
test('real dashboard keeps all original scripts, IDs, forms and auth logic',async()=>{
 const r=await memberExperienceEntry(request('/member/dashboard'),enabled,page(dashboard)),html=await r.text();
 const scripts=s=>[...s.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)].map(x=>x[0]);
 assert.deepEqual(scripts(html).slice(0,-1),scripts(dashboard));
 const ids=s=>[...s.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.deepEqual(ids(html),ids(dashboard));
 assert.match(html,/data-member-experience="v1"/);assert.match(html,/name="firstName"/);assert.doesNotMatch(html,/name="firstName"[^>]*value="Matt"/);
 assert.match(html,/id="previewMember"[^>]*hidden/);assert.match(html,/href="\/member\/dashboard#journey"/);
 assert.match(r.headers.get('Vary'),/Cookie/);assert.equal(r.headers.get('ETag'),null);assert.match(r.headers.get('Cache-Control'),/no-store/);
});
test('no workplace link unless the workplace feature is enabled',async()=>{
 const html=await(await memberExperienceEntry(request('/member/dashboard'),{MEMBER_EXPERIENCE_V1_ENABLED:'true'},page(dashboard))).text();assert.doesNotMatch(html,/href="\/member\/work"/);
});
test('public pages, errors and non-HTML responses remain untouched',async()=>{
 for(const [path,response]of [['/',page(dashboard)],['/member/fit',new Response('No',{status:503})],['/member/fit',Response.json({error:'x'})]])assert.equal(await memberExperienceEntry(request(path),enabled,response),response);
});
test('enhancement is idempotent and does not lose the two existing dashboard modules',async()=>{
 const withModules=dashboard.replace('id="todayActions"','data-modules="work programme" id="todayActions"');
 const once=await memberExperienceEntry(request('/member/dashboard'),enabled,page(withModules));
 const twice=await memberExperienceEntry(request('/member/dashboard'),enabled,once.clone());
 assert.equal(await once.text(),await twice.text());
});
test('Saved replaces obsolete placeholder copy with real tool destinations',async()=>{
 const source='<html><head></head><body><main id="main-content">Future member accounts</main></body></html>';
 const html=await(await memberExperienceEntry(request('/member/saved'),enabled,page(source))).text();
 assert.doesNotMatch(html,/Future member accounts/);for(const href of ['/member/grub#saved','/member/dashboard#journey','/member/check-in#history','/member/settings'])assert.ok(html.includes('href="'+href+'"'));
});
test('private static assets expose no data-writing client or bundled helper dependencies',async()=>{
 const r=memberExperienceRoutes(request('/assets/member-experience/v1.mjs'),enabled),js=await r.text();new Function(js);
 assert.doesNotMatch(js,/\bfetch\s*\(|localStorage|sessionStorage|__name\b/);
 assert.equal((await memberExperienceRoutes(new Request('https://shiftsometimber.co.uk/assets/member-experience/v1.css',{method:'HEAD'}),enabled).text()),'');
});
test('design review blocks network and mutation even on unknown fixture paths',async()=>{
 const r=await memberReviewRoutes(new Request('https://stage.test/staging/member/fixture.mjs'),{});assert.match(r.headers.get('Content-Security-Policy'),/connect-src 'none'/);assert.match(r.headers.get('Content-Security-Policy'),/form-action 'none'/);new Function(await r.text());
 const post=await memberReviewRoutes(new Request('https://stage.test/staging/member/grub',{method:'POST'}),{});assert.equal(post.status,405);
 const raw=await memberReviewRoutes(new Request('https://stage.test/staging/member-source/app.js'),{});assert.equal(raw.status,404);
});
