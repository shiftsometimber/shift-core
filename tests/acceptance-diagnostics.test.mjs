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
  handlers.response({status:()=>503,url:()=> 'https://test/v1/health-passport?token=secret',request:()=>({method:()=> 'POST',resourceType:()=> 'fetch',isNavigationRequest:()=>false})});
  assert.equal(report.resources[0].status,503);assert.equal(rows.length,1);
  assert.deepEqual(state(),{page:'https://test/member/dashboard#grub',frames:['https://test/member/grub#today']});
  assert.equal(JSON.stringify(report).includes('secret'),false);
  assert.equal(resourcePath('invalid'),'[unavailable]');
});
test('bounded diagnostics retain latest failure metadata',()=>{
  const handlers={},report={};attachDiagnostics({on:(n,f)=>handlers[n]=f},report,()=>{});
  for(let i=0;i<170;i++)handlers.requestfailed({url:()=>`https://test/${i}?private=yes`,method:()=> 'GET',resourceType:()=> 'document',failure:()=>({errorText:'net::ERR_ABORTED'})});
  assert.equal(report.resources.length,160);assert.equal(report.resources.at(-1).url,'https://test/169');
});
