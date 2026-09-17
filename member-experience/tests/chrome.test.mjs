import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {memberNavigation,memberChromeClient,memberChromeStyles,addMemberChrome,lifeBackChrome} from '../chrome.mjs';
import {memberExperienceEntry,memberExperienceRoutes,memberPages} from '../entry.mjs';
test('shared chrome retains original form controls, handlers and content and is idempotent',()=>{
 const original='<html><head><title>Member</title></head><body data-member-page="settings"><main><h1>Your settings</h1><form id="existing"><input id="privacy"><button>Save</button></form></main><script src="/existing.js"></script></body></html>';
 const out=addMemberChrome(original,'settings');
 assert.ok(out.includes('<main><h1>Your settings</h1><form id="existing"><input id="privacy"><button>Save</button></form></main>'));
 assert.ok(out.includes('<script src="/existing.js"></script>'));
 assert.equal(addMemberChrome(out,'settings'),out);
 new Function(memberChromeClient);assert.doesNotMatch(memberChromeClient,/\bfetch\s*\(|localStorage|sessionStorage|innerHTML/);
});
test('all current member pages receive the same header and presentation assets, public pages do not',async()=>{
 const env={MEMBER_EXPERIENCE_V1_ENABLED:'true'},source='<html><head></head><body><main><h1>Existing title</h1><p>Existing introduction</p></main></body></html>';
 for(const page of memberPages){
  const out=await(await memberExperienceEntry(new Request('https://shift.test/member/'+page),env,new Response(source,{headers:{'Content-Type':'text/html'}}))).text();
  assert.ok(out.includes(memberNavigation(false)),page);assert.ok(out.includes('data-member-chrome="v1"'),page);
 }
 const r=new Response(source,{headers:{'Content-Type':'text/html'}});
 assert.equal(await memberExperienceEntry(new Request('https://shift.test/about'),env,r),r);
 assert.ok(!memberNavigation(false).includes('/member/work'));
 assert.ok(memberNavigation(true).includes('/member/work'));
});
test('Life Back keeps all working content and scripts while replacing only its competing navigation',()=>{
 const original=readFileSync(new URL('../life-back/index.html',import.meta.url),'utf8');
 const out=lifeBackChrome(original);
 assert.equal((out.match(/class="sst-member-tabs"/g)||[]).length,1);
 assert.ok(!out.includes('class="member-nav"'));
 assert.equal(out.match(/<main[\s\S]*?<\/main>/)[0],original.match(/<main[\s\S]*?<\/main>/)[0]);
 for(const id of ['checkinForm','goalForm','scoreRing','overallScore','historyDialog'])assert.ok(out.includes('id="'+id+'"'));
 assert.ok(out.includes('/assets/member-experience/life-back/client.mjs'));
});
test('shared assets are private, same-origin and use the existing approved banner image',async()=>{
 const env={MEMBER_EXPERIENCE_V1_ENABLED:'true'};
 for(const name of ['chrome.css','chrome.mjs']){
 const r=memberExperienceRoutes(new Request('https://shift.test/assets/member-experience/'+name),env);
 assert.equal(r.status,200);assert.match(r.headers.get('Cache-Control'),/no-store/);
 }
 assert.ok(memberChromeStyles.includes('/assets/home-hero-men-v32o.jpg'));
 assert.ok(memberChromeStyles.includes('-webkit-text-fill-color:#050505!important'));
});
