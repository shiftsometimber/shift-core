import test from 'node:test';
import assert from 'node:assert/strict';
import {workClient} from '../client.mjs';
import {workDashboardEntry} from '../dashboard-entry.mjs';
import {DASHBOARD_ANCHOR} from '../../programme/dashboard-entry.mjs';
const tick=()=>new Promise(r=>setImmediate(r));
function harness(mode='employer'){
 const events={},requests=[],node=()=>({innerHTML:'',textContent:'',dataset:{mode},replaceChildren(){this.innerHTML='';this.textContent=''},querySelectorAll(){return []}});
 const root=node(),status=node(),document={visibilityState:'visible',querySelector:s=>s==='#work-app'?root:s==='#work-status'?status:null,addEventListener:(e,fn)=>events[e]=fn};
 const fetch=(url,options)=>new Promise(resolve=>requests.push({url,options,resolve}));
 new Function('document','fetch','addEventListener','AbortController','DOMException','('+workClient.toString()+')()')(document,fetch,(e,fn)=>events[e]=fn,AbortController,DOMException);
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
