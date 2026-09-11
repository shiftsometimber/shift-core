import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from '../test-support/fixtures.mjs';
import {publicState} from '../service.mjs';
const source=readFileSync(process.env.PROGRAMME_CLIENT_SOURCE||new URL('../../frontend/member/assets/programme-v1/programme.mjs',import.meta.url),'utf8');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}};
function harness(){
 const requests=[],events={};
 const node=()=>({textContent:'',innerHTML:'',disabled:false,dataset:{},classList:{toggle(){},contains(){return false}},replaceChildren(){this.textContent='';this.innerHTML=''},insertAdjacentHTML(){},setAttribute(){},focus(){},addEventListener(){},querySelector(){return node()},querySelectorAll(){return []}});
 const root=node(),nodes=new Map();root.querySelector=s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)};
 const document={querySelector:s=>s==='#programme'?root:null,addEventListener(){}};
 const window={addEventListener:(k,fn)=>events[k]=fn};
 const fetch=(url,options)=>{const d=deferred();requests.push({url,options,...d});return d.promise};
 const run=new AsyncFunction('document','window','fetch','crypto','AbortController',source+'\nreturn {save,api,clearPrivateView,getState:()=>state,getPreview:()=>preview};')(document,window,fetch,globalThis.crypto,AbortController);
 const response=(index,data,status=200)=>requests[index].resolve({ok:status===200,status,json:async()=>data});
 return {requests,events,nodes,run,response};
}
const saved=()=>publicState(fixture('Dave'),{fixtureMode:true});
test('A delayed initial read cannot restore private data after page exit',async()=>{
 const h=harness();h.events.pagehide();h.response(0,saved());const app=await h.run;
 assert.equal(app.getState(),null);assert.equal(h.nodes.get('#sp-name').textContent,'The Programme');assert.equal(h.nodes.get('#sp-view').innerHTML,'');
});
test('A delayed save is discarded after page exit even if the transport ignores abort',async()=>{
 const h=harness();h.response(0,saved());const app=await h.run;const pending=app.save('review');
 h.events.pagehide();h.response(1,saved());await pending;
 assert.equal(app.getState(),null);assert.equal(h.nodes.get('#sp-status').textContent,'');assert.equal(h.nodes.get('#sp-view').innerHTML,'');
});
test('A delayed preview rejects after private state is cleared',async()=>{
 const h=harness();h.response(0,saved());const app=await h.run;
 const pending=app.api('/preview',{revision:0});h.events.pagehide();h.response(1,{recipe:{name:'Private choice'}});
 await assert.rejects(pending,e=>e.cancelled===true);assert.equal(app.getState(),null);
});
test('A delayed existing-tool response is rejected after clearing the account',async()=>{
 const h=harness();h.response(0,saved());const app=await h.run;
 const pending=app.api('/existing-tools');h.events.pagehide();h.response(1,{journey:{purpose:'Private purpose'}});
 await assert.rejects(pending,e=>e.cancelled===true);assert.equal(app.getState(),null);
});
test('Session expiry clears the member view and cancels other outstanding requests',async()=>{
 const h=harness();h.response(0,saved());const app=await h.run;
 const first=app.api('/existing-tools'),second=app.api('/preview',{});
 h.response(1,{error:'Session ended'},401);await assert.rejects(first);
 h.response(2,{recipe:{name:'Old member'}});await assert.rejects(second,e=>e.cancelled===true);
 assert.equal(app.getState(),null);assert.equal(app.getPreview(),null);assert.match(h.nodes.get('#sp-view').innerHTML,/Return to My Timber sign-in/);
});
