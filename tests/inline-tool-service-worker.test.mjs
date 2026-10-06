import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {serviceWorker} from '../my-timber-pwa/service-worker.mjs';
function worker(fetchImpl=async()=>new Response('network')){
 const handlers=new Map(),calls=[];
 runInNewContext(serviceWorker,{self:{location:{origin:'https://shiftsometimber.co.uk'},addEventListener:(name,fn)=>handlers.set(name,fn)},URL,Response,fetch:r=>{calls.push(r);return fetchImpl(r)}});
 return {calls,request(path,overrides={}){
  const request={url:new URL(path,'https://shiftsometimber.co.uk').href,method:'GET',mode:'navigate',credentials:'include',headers:{Cookie:'synthetic-session'},...overrides};let response;
  handlers.get('fetch')({request,respondWith:p=>response=p});return {request,response};
 }};
}
test('all inline tool panels pass the original authenticated Request directly to the network',async()=>{
 for(const tool of ['fit','grub','life-back'])for(const view of ['app','web']){
  const w=worker(),r=w.request('/member/'+tool+'?view='+view+'&app_panel=1');
  assert(r.response);assert.equal(await (await r.response).text(),'network');
  assert.equal(w.calls.length,1);assert.equal(w.calls[0],r.request);assert.equal(w.calls[0].credentials,'include');assert.equal(w.calls[0].headers.Cookie,'synthetic-session');
 }
});
test('other query strings, origins and non-navigation requests retain browser handling',()=>{
 for(const path of ['/member/grub?view=app','/member/grub?view=app&app_panel=0','/member/grub?view=app&app_panel=1&extra=1','/member/grub?view=app&app_panel=1&app_panel=1','/member/grub?view=invalid&app_panel=1','/member/dashboard?view=app&app_panel=1','/member-login?view=app&app_panel=1','https://example.com/member/grub?view=app&app_panel=1']){
  const w=worker();assert.equal(w.request(path).response,undefined,path);assert.equal(w.calls.length,0);
 }
 for(const overrides of [{method:'POST'},{mode:'cors'},{mode:'no-cors'}])assert.equal(worker().request('/member/grub?view=app&app_panel=1',overrides).response,undefined);
});
test('plain member navigation and the existing offline response stay intact',async()=>{
 const w=worker();assert.equal(await (await w.request('/member/dashboard').response).text(),'network');
 const offline=worker(async()=>{throw Error('offline')});
 const r=await offline.request('/member/grub?app_panel=1&view=web').response;
 assert.equal(r.status,503);assert.equal(r.headers.get('Cache-Control'),'no-store');
 const body=await r.text();assert.match(body,/Reconnect to open My Timber/);assert.doesNotMatch(body,/synthetic-session/);
});
