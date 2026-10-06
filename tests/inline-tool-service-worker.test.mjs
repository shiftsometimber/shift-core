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

import {memberWorkerHtml,memberWorkerAsset} from '../my-timber-pwa/presentation.mjs';
test('member legacy bootstrap aliases are bounded, preserve the shell and are idempotent',()=>{
 const before='<main><form>member details</form></main><script defer src="/app.js?v=phase8v10"></script><script src="/register-sw-v3a.js?v=32u5"></script><script src="/other.js"></script><footer>retained</footer>';
 const after=memberWorkerHtml(before);
 assert.equal(after,before.replace('/app.js?v=phase8v10','/app.js?v=phase8v10&amp;member_worker=1').replace('/register-sw-v3a.js?v=32u5','/register-sw-v3a.js?v=32u5&amp;member_worker=1'));
 assert.equal(memberWorkerHtml(after),after);
});
test('both member legacy loaders use the existing root registration without changing other code',async()=>{
 const shared="navigator.serviceWorker.register('/shift-push-sw-v1.js',{scope:'/',updateViaCache:'none'})";
 for(const [path,legacy] of [['/app.js',"navigator.serviceWorker.register('/service-worker.js')"],['/register-sw-v3a.js',"navigator.serviceWorker.register('/service-worker-v3a.js?v=cos-live-recovery-20260909-r2',{updateViaCache:'none'})"]]){
  const body='const retained=1;'+legacy+'.catch(()=>{});const footer=2;';
  const r=await memberWorkerAsset(new Request('https://shiftsometimber.co.uk'+path+'?v=old&member_worker=1'),new Response(body,{headers:{'Content-Type':'application/javascript','Content-Length':'100','ETag':'old','Cache-Control':'public'}}));
  assert.equal(r.status,200);assert.equal(await r.text(),body.replace(legacy,shared));assert.equal(r.headers.get('Cache-Control'),'no-store');assert.equal(r.headers.get('ETag'),null);assert.equal(r.headers.get('Content-Length'),null);
  const publicResponse=new Response(body,{headers:{'Content-Type':'application/javascript'}});
  assert.equal(await memberWorkerAsset(new Request('https://shiftsometimber.co.uk'+path+'?v=old'),publicResponse),null);assert.equal(await publicResponse.text(),body);
 }
});
test('unknown member loader source fails closed and other requests are untouched',async()=>{
 const r=await memberWorkerAsset(new Request('https://shiftsometimber.co.uk/app.js?member_worker=1'),new Response('changed upstream',{headers:{'Content-Type':'application/javascript'}}));assert.equal(r.status,503);
 for(const url of ['/other.js?member_worker=1','/app.js?member_worker=2'])assert.equal(await memberWorkerAsset(new Request('https://shiftsometimber.co.uk'+url),new Response('retained')),null);
 assert.equal(await memberWorkerAsset(new Request('https://shiftsometimber.co.uk/app.js?member_worker=1',{method:'POST'}),new Response('retained')),null);
});

import {originalMemberWorkerPresentation,PWA_DISMISS_APPROVED} from '../release/app-scope.mjs';
import {execFileSync} from 'node:child_process';
test('historical PWA comparison reverses only the exact member registration additions',()=>{
 const current=execFileSync('git',['show','HEAD:my-timber-pwa/presentation.mjs'],{encoding:'utf8'}),prior=execFileSync('git',['show',PWA_DISMISS_APPROVED+':my-timber-pwa/presentation.mjs'],{encoding:'utf8'});
 assert.equal(originalMemberWorkerPresentation(current),prior);
 assert.notEqual(originalMemberWorkerPresentation(current.replace('Your full My Timber account','Unreviewed account copy')),prior);
 assert.notEqual(originalMemberWorkerPresentation(current.replace("scope:'/',updateViaCache:'none'","scope:'/member/',updateViaCache:'none'")),prior);
});
