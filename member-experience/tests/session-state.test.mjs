import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {sessionRuntime,withSessionState} from '../session-state.mjs';
import {memberExperienceRoutes} from '../entry.mjs';

function harness(response){
 const node=()=>({children:[],hidden:false,setAttribute(){},replaceChildren(){this.children=[]},append(...children){this.children.push(...children)}});
 const box=node(),auth=node(),body={dataset:{}},document={body,getElementById:id=>id==='memberSessionStatus'?box:id==='previewAuth'?auth:null,createElement:node,addEventListener(){}};
 const window={};vm.runInNewContext(sessionRuntime,{window,document,fetch:async()=>response,AbortController,setTimeout,clearTimeout,location:{pathname:'/member/check-in',search:'',hash:''},encodeURIComponent});
 return {box,auth,body,window};
}
test('a valid retained session reveals the member once without a login form',async()=>{
 const h=harness(Response.json({user:{id:123}}));let shown=0;await h.window.SST_MEMBER_SESSION.check(()=>shown++);assert.equal(h.body.dataset.memberSession,'ready');assert.equal(h.box.hidden,true);assert.equal(shown,1);
});
test('anonymous401 exposes sign-in and never runs the member callback',async()=>{
 const h=harness(new Response('',{status:401}));h.auth.hidden=true;await h.window.SST_MEMBER_SESSION.check(()=>assert.fail('must not reveal member'));assert.equal(h.body.dataset.memberSession,'signed-out');assert.equal(h.auth.hidden,false);
});
test('network/service and malformed session responses offer retry without revealing member',async()=>{
 for(const response of [new Response('',{status:503}),Response.json({ok:true})]){const h=harness(response);await h.window.SST_MEMBER_SESSION.check(()=>assert.fail('must not reveal member'));assert.equal(h.body.dataset.memberSession,'error');assert.equal(h.box.children.at(-1).textContent,'Retry sign-in check');}
});
test('both real dashboard and login shell keep credential handlers but start hidden',()=>{
 for(const file of ['../test-support/dashboard.html','../../frontend/member/my-timber-preview.html']){
  const html=readFileSync(new URL(file,import.meta.url),'utf8');
  const result=withSessionState(html);assert.match(result,/data-member-session="pending"/);assert.match(result,/id="previewAuth" hidden/);assert.match(result,/SST_MEMBER_SESSION.check\(showMember\)/);assert.match(result,/SST_API\[mode\]\(data\)/);assert.equal(withSessionState(result),result);
 }
});
test('every legacy Ask Timber mode redirects to a review, never performs a write or accepts an external target',()=>{
 for(const [mode,expected]of [['working-late','working_late'],['ten-minutes','no_time'],['limited-food','next_three_hours'],['quick-breakfast','missed_lunch'],['plans-changed','plans_cancelled'],['eating-out','eating_out'],['travel','plans_cancelled'],['https://evil.example','next_three_hours']]){
  const r=memberExperienceRoutes(new Request('https://shiftsometimber.co.uk/member/life-changed-preview?mode='+encodeURIComponent(mode)),{MEMBER_EXPERIENCE_V1_ENABLED:'true'});assert.equal(r.status,302);assert.equal(r.headers.get('Location'),'/member/dashboard?reviewChange='+expected+'#today');assert.match(r.headers.get('Cache-Control'),/no-store/);
 }
});
