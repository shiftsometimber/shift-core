import test from 'node:test';
import assert from 'node:assert/strict';
import {inferenceText,openInference,answerStream} from '../member-experience/ai-stream.mjs';
import {fixture} from './helpers/ai-member-fixture.mjs';
import {attachConversationMemory,memoryAccess} from '../member-experience/ai-memory-bridge.mjs';
const encoder=new TextEncoder(),chunk=value=>encoder.encode('data: '+JSON.stringify(value)+'\n\n');
async function collect(stream,options){let result='';for await(const text of inferenceText(stream,options))result+=text;return result}
test('decoder flushes an unterminated event and preserves split Unicode and CRLF',async()=>{
 const bytes=encoder.encode('data: {"response":"Café — useful."}\r\n\r\ndata: {"response":" Complete."}');
 const stream=new ReadableStream({start(c){for(const b of bytes)c.enqueue(new Uint8Array([b]));c.close()}});
 assert.equal(await collect(stream),'Café — useful. Complete.');
});
test('explicit truncation, provider errors and malformed tails reject partial answers',async()=>{
 for(const tail of ['data: {"choices":[{"finish_reason":"length"}]}','data: {"error":"provider failed"}','data: broken']){
  const stream=new ReadableStream({start(c){c.enqueue(chunk({response:'Partial.'}));c.enqueue(encoder.encode(tail));c.close()}});
  await assert.rejects(()=>collect(stream));
 }
});
test('transport EOF without a completion marker cannot become a completed model answer',async()=>{
 const raw=new ReadableStream({start(c){c.enqueue(chunk({response:'Plausible but cut short.'}));c.close()}});
 await assert.rejects(()=>collect(raw,{requireTerminal:true}),/incomplete_answer/);
 const complete=new ReadableStream({start(c){c.enqueue(chunk({response:'Complete.'}));c.enqueue(encoder.encode('data: [DONE]'));c.close()}});
 assert.equal(await collect(complete,{requireTerminal:true}),'Complete.');
});
test('heartbeats cannot extend first-text deadline; stalled reader is cancelled',async()=>{
 let cancelled=false,timer;
 const stream=new ReadableStream({start(c){timer=setInterval(()=>c.enqueue(encoder.encode(': ping\n\n')),2)},cancel(){cancelled=true;clearInterval(timer)}});
 await assert.rejects(()=>collect(stream,{firstTextTimeoutMs:25}),/provider_timeout/);assert(cancelled);
});
test('partial stream exceeding idle deadline cannot persist or cache a completed reply',async t=>{
 const {DB}=fixture(t);const journey={status:'available'};await attachConversationMemory(DB,1,journey);const access=memoryAccess(journey);assert(access);let cancelled=false,writes=0;
 const raw=new ReadableStream({start(c){c.enqueue(chunk({response:'Partial.'}))},cancel(){cancelled=true}});
 const tokens=inferenceText(raw,{idleTimeoutMs:25});
 const response=answerStream(tokens,{headers:{},requestId:'synthetic',access,request:new Request('https://example.test'),meta:{journeyUsed:false,sources:[]},onComplete(){writes++}});
 const text=await response.text();assert.match(text,/answer_interrupted/);assert.doesNotMatch(text,/event: done/);assert.equal(writes,0);assert(cancelled);
 assert.equal(DB.sqlite.prepare("SELECT COUNT(*) n FROM shift_ai_conversations WHERE direction='assistant'").get().n,0);
});
test('opening timeout cancels a late stream and never starts a retry',async()=>{
 let resolve,cancelled=false,calls=0;
 const opening=openInference(()=>{calls++;return new Promise(r=>resolve=r)},{timeoutMs:20});
 await assert.rejects(opening,/provider_timeout/);
 resolve(new ReadableStream({cancel(){cancelled=true}}));await new Promise(r=>setTimeout(r,0));assert(cancelled);assert.equal(calls,1);
});
test('request abort interrupts an active reader rather than waiting for idle timeout',async()=>{
 let cancelled=false;const abort=new AbortController();
 const tokens=await openInference(()=>new ReadableStream({start(c){c.enqueue(chunk({response:'First.'}))},cancel(){cancelled=true}}),{signal:abort.signal});
 const result=(async()=>{for await(const text of tokens){assert.equal(text,'First.');abort.abort()}})();
 await assert.rejects(result,/cancelled/);assert(cancelled);
});
