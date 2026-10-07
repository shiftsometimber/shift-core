import test from 'node:test';
import assert from 'node:assert/strict';
import {boundedEvidence,resourcePath,attachDiagnostics} from '../health-passport/acceptance-diagnostics.mjs';
test('a permanently stalled evidence operation cannot prevent saving a failure',async()=>{
  await assert.rejects(boundedEvidence('stalled',()=>new Promise(()=>{}),15),/stalled exceeded 15ms/);
  assert.equal(await boundedEvidence('ready',()=>42,100),42);
});
test('resource diagnostics exclude query credentials and response bodies',()=>{
  const handlers={}, report={}, rows=[];
  const page={on:(name,fn)=>handlers[name]=fn,url:()=> 'https://test/member/dashboard?token=secret#grub',frames:()=>[{url:()=> 'https://test/member/grub?app_panel=1#today'}]};
  const state=attachDiagnostics(page,report,()=>rows.push(JSON.stringify(report)));
  handlers.response({status:()=>503,url:()=> 'https://test/v1/health-passport?token=secret',request:()=>({url:()=> 'https://test/v1/health-passport?token=secret',method:()=> 'POST',resourceType:()=> 'fetch',isNavigationRequest:()=>false})});
  assert.equal(report.resources[0].status,503);assert.equal(rows.length,1);
  assert.deepEqual(state(),{page:'https://test/member/dashboard#grub',frames:['https://test/member/grub#today'],pending:[]});
  assert.equal(JSON.stringify(report).includes('secret'),false);
  assert.equal(resourcePath('invalid'),'[unavailable]');
});
test('bounded diagnostics retain latest failure metadata',()=>{
  const handlers={},report={};attachDiagnostics({on:(n,f)=>handlers[n]=f},report,()=>{});
  for(let i=0;i<250;i++)handlers.requestfailed({url:()=>`https://test/${i}?private=yes`,method:()=> 'GET',resourceType:()=> 'document',failure:()=>({errorText:'net::ERR_ABORTED'})});
  assert.equal(report.resources.length,240);assert.equal(report.resources.at(-1).url,'https://test/249');
});

test('outstanding requests and document lifecycle expose stalled reloads without retaining credentials',()=>{
 const handlers={},report={};const page={on:(name,fn)=>handlers[name]=fn,url:()=> 'https://test/member/dashboard?token=secret',mainFrame:()=>frame,frames:()=>[frame]};
 const frame={url:()=> 'https://test/member/dashboard?token=secret'};const snapshot=attachDiagnostics(page,report,()=>{});
 const request={url:()=> 'https://test/script.js?token=secret',method:()=> 'GET',resourceType:()=> 'script',isNavigationRequest:()=>false};
 handlers.request(request);handlers.framenavigated(frame);
 assert.equal(snapshot().pending[0].url,'https://test/script.js');assert.equal(report.resources.at(-1).kind,'frame_committed');
 handlers.domcontentloaded();assert.equal(report.resources.at(-1).kind,'domcontentloaded');
 handlers.requestfinished(request);assert.deepEqual(snapshot().pending,[]);
 assert.doesNotMatch(JSON.stringify(report),/secret/);
});
