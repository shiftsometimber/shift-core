import test from 'node:test';
import assert from 'node:assert/strict';
import {boundedEvidence,resourcePath,attachDiagnostics,navigationLogSummary} from '../health-passport/acceptance-diagnostics.mjs';
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

test('failure log contains bounded network state without account data or credentials',()=>{
 const report={navigation:{page:'https://test/member/dashboard?token=secret#private',frames:['https://test/member/dashboard?token=secret'],pending:[{url:'https://test/script.js?token=secret',method:'GET',resourceType:'script',startedMs:123,headers:{cookie:'secret'},body:'private health note'}]},
 resources:[{kind:'response',status:503,url:'https://test/v1/fit/plan?member=secret',method:'POST',resourceType:'fetch',body:'weight 88'},{kind:'request_failed',url:'https://test/v1/health-passport/records/private-identity',error:'free text secret'}],
 reloadFailureState:{readyState:'loading',memberReady:false,authHidden:false,title:'private identity',answers:'weight 88'}};
 const s=navigationLogSummary(report),text=JSON.stringify(s);
 assert.equal(s.navigation.pending[0].url,'https://test/script.js');assert.equal(s.resources[0].status,503);assert.equal(s.document.readyState,'loading');
 assert.doesNotMatch(text,/secret|private|weight|cookie|headers|answers|title/);
 assert.equal(s.resources[1].url,'https://test/[other-path]');
});
test('failure log bounds arrays and redacts unknown hosts, paths and free-text errors',()=>{
 const row={url:'https://external.test/private-name?secret=1',method:'POST',resourceType:'fetch',error:'secret'};
 const report={navigation:{page:'about:blank',frames:Array(20).fill('invalid'),pending:Array(80).fill(row)},resources:Array(90).fill(row)};
 const s=navigationLogSummary(report);assert.equal(s.navigation.page,'about:blank');assert.equal(s.navigation.pending.length,20);assert.equal(s.navigation.frames.length,12);assert.equal(s.resources.length,40);
 assert.equal(s.resources[0].url,'[external]');assert.doesNotMatch(JSON.stringify(s),/secret|private-name/);
});
