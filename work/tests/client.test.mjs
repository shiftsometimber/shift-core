import test from 'node:test';
import assert from 'node:assert/strict';
import {workClientSource} from '../client.mjs';
import {workDashboardEntry} from '../dashboard-entry.mjs';
import {DASHBOARD_ANCHOR} from '../../programme/dashboard-entry.mjs';
const tick=()=>new Promise(r=>setImmediate(r));
function harness(mode='employer'){
 const events={},requests=[],node=()=>({innerHTML:'',textContent:'',dataset:{mode},replaceChildren(){this.innerHTML='';this.textContent=''},querySelectorAll(){return []}});
 const root=node(),status=node(),document={visibilityState:'visible',querySelector:s=>s==='#work-app'?root:s==='#work-status'?status:null,addEventListener:(e,fn)=>events[e]=fn};
 const fetch=(url,options)=>new Promise(resolve=>requests.push({url,options,resolve}));
 new Function('document','fetch','addEventListener','AbortController','DOMException',workClientSource)(document,fetch,(e,fn)=>events[e]=fn,AbortController,DOMException);
 const response=(i,b,status=200)=>requests[i].resolve({status,ok:status===200,json:async()=>b});return {document,events,requests,root,status,response};
}
const report=name=>({reports:[{name,start:'2026-09-14',end:'2026-12-07',report:{status:'not-released'}}]});
test('Late private responses cannot repopulate the DOM after page exit, even if abort is ignored',async()=>{const h=harness();h.events.pagehide();h.response(0,report('Private company'));await tick();assert.equal(h.root.innerHTML,'');assert.equal(h.requests[0].options.signal.aborted,true)});
test('Visibility closes old identity; only the newly authenticated response can render on return',async()=>{const h=harness();h.document.visibilityState='hidden';h.events.visibilitychange();h.document.visibilityState='visible';h.events.visibilitychange();h.response(1,report('New company'));await tick();h.response(0,report('Old company'));await tick();assert.match(h.root.innerHTML,/New company/);assert.doesNotMatch(h.root.innerHTML,/Old company/)});
test('Session expiry clears private data and escapes company-provided text',async()=>{const h=harness();h.response(0,report('<img src=x onerror=alert(1)>'));await tick();assert.match(h.root.innerHTML,/&lt;img/);assert.doesNotMatch(h.root.innerHTML,/<img/);h.events.pageshow({persisted:true});h.response(1,{error:'Sign in again.'},401);await tick();assert.equal(h.root.innerHTML,'');assert.match(h.status.textContent,/Sign in again/)});
test('Hidden bfcache pages do not start another private load',async()=>{const h=harness();h.document.visibilityState='hidden';h.events.visibilitychange();h.events.pageshow({persisted:true});assert.equal(h.requests.length,1)});
test('Workplace dashboard entry preserves all original HTML and remains absent when disabled or signed out',async()=>{
 const body='<header>Original navigation</header><main>'+DASHBOARD_ANCHOR+'Original free tools</section></main><footer>Original footer</footer>',request=new Request('https://test.invalid/member/dashboard'),source=()=>new Response(body,{headers:{'Content-Type':'text/html','ETag':'old'}});
 const response=await workDashboardEntry(request,{WORK_V1_ENABLED:'true'},source(),{authenticate:async()=>({userId:1})}),html=await response.text();assert.equal(html.replace(/<section class="mt-card" id="sstWorkEntry">[\s\S]*?<\/section>/,''),body);assert.equal(response.headers.get('ETag'),null);
 for(const on of [false,true]){const r=source();assert.equal(await workDashboardEntry(request,{WORK_V1_ENABLED:String(on)},r,{authenticate:async()=>({response:new Response(null,{status:401})})}),r)}
});
const workplace={employerId:'fictional-ui',name:'Example workplace',start:'2026-09-14',end:'2026-12-07',status:'active',active:true,week:4,completedWeeks:[1,2,3],scope:'Agreed programme scope',support:'Agreed support limits',testing:{message:'Testing is unavailable.'}};
test('Returning members see their current programme before the optional joining form',async()=>{
 const h=harness('member');h.response(0,{workplaces:[workplace]});await tick();
 const html=h.root.innerHTML;assert.ok(html.indexOf('data-cohort="fictional-ui"')<html.indexOf('data-kind="join"'));
 assert.match(html,/WEEK 4 OF 12/);assert.match(html,/3 of 12 complete/);assert.match(html,/data-week="4" data-done="false"/);assert.match(html,/Your privacy and workplace data/);
 assert.match(html,/Have another workplace invitation/);assert.match(html,/Your employer cannot open your account/);
});
test('First join retains the complete voluntary notice before the joining controls',async()=>{
 const h=harness('member');h.response(0,{workplaces:[]});await tick();const html=h.root.innerHTML;
 assert.ok(html.indexOf('Your employer cannot open your account')<html.indexOf('name="consent"'));
 assert.match(html,/Joining is optional/);assert.match(html,/name="consent" required/);assert.doesNotMatch(html,/data-cohort/);
});
test('Upcoming and inactive programmes show no review write controls; completed current week is explicit',async()=>{
 for(const [week,active]of [[0,false],[4,false],[12,false]]){const h=harness('member');h.response(0,{workplaces:[{...workplace,week,active}]});await tick();assert.doesNotMatch(h.root.innerHTML,/data-action="review"/);assert.match(h.root.innerHTML,/Your place is confirmed|Weekly updates are closed/)}
 const h=harness('member');h.response(0,{workplaces:[{...workplace,completedWeeks:[1,2,3,4]}]});await tick();assert.match(h.root.innerHTML,/Your review is saved/);assert.match(h.root.innerHTML,/data-week="4" data-done="true"/);
});
