import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../frontend/member/turnstile-auth-v1.js',import.meta.url),'utf8');
function setup({fetcher,loaded=true,execute}={}){
 const timers=new Map(),nodes=[],removed=[],formNodes=[];let options,id=0;
 const form={querySelector:()=>({before:n=>formNodes.push(n)}),appendChild:n=>formNodes.push(n)};
 const document={activeElement:{closest:()=>form},querySelector:()=>({form}),head:{appendChild:n=>nodes.push(n)},body:{appendChild:()=>assert.fail('challenge must be inside form')},createElement:()=>({style:{},setAttribute(){},remove(){this.removed=true}})};
 const window={SST_API_BASE:'https://test.invalid'};
 if(loaded)window.turnstile={render(node,opts){options=opts;return 'widget'},execute(){execute?.(options)},remove:id=>removed.push(id)};
 vm.runInNewContext(source,{window,document,fetch:fetcher||(async()=>({ok:true,json:async()=>({required:true,enabled:true,siteKey:'public-test-key'})})),AbortController,setTimeout:(fn,ms)=>{const key=++id;timers.set(key,{fn,ms});return key},clearTimeout:key=>timers.delete(key),Map,Promise,Error});
 return {api:window.SSTTurnstile,timers,nodes,formNodes,removed,get options(){return options},tick(ms){for(const [key,t]of [...timers])if(t.ms===ms){timers.delete(key);t.fn()}}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('hanging config fails closed and can be retried',async()=>{
 const s=setup({fetcher:()=>new Promise(()=>{})});const p=s.api.getToken('member_login');await settle();s.tick(8000);await assert.rejects(p,/could not connect/);const retry=s.api.getToken('member_login');await settle();assert.equal(s.timers.size,1);s.tick(8000);await assert.rejects(retry,/could not connect/);
});
test('config response with a stalled body is also bounded',async()=>{
 const s=setup({fetcher:async()=>({ok:true,json:()=>new Promise(()=>{})})});const p=s.api.getToken('member_login');await settle();s.tick(8000);await assert.rejects(p,/could not connect/);
});
test('hanging challenge script releases the login attempt',async()=>{
 const s=setup({loaded:false});const p=s.api.getToken('member_login');await settle();s.tick(12000);await assert.rejects(p,/did not load/);assert.equal(s.nodes[0].removed,true);
});
test('silent challenge times out, cleans up and permits another attempt',async()=>{
 const s=setup();const p=s.api.getToken('member_login');await settle();assert.equal(s.formNodes.length,1);s.tick(45000);await assert.rejects(p,/timed out/);assert.equal(s.formNodes[0].removed,true);assert.deepEqual(s.removed,['widget']);const retry=s.api.getToken('member_login');await settle();s.options.callback('synthetic-test-token');assert.equal(await retry,'synthetic-test-token');
});
test('successful challenge attaches token without altering supplied credentials',async()=>{
 const s=setup({execute:o=>o.callback('synthetic-test-token')});const result=await s.api.protect('/auth/login',{marker:'unchanged'});assert.equal(result.marker,'unchanged');assert.equal(result.turnstileToken,'synthetic-test-token');assert.equal(s.timers.size,0);
});
test('unsupported and expired challenges reject instead of hanging',async()=>{
 for(const callback of ['unsupported-callback','expired-callback','timeout-callback']){const s=setup();const p=s.api.getToken('member_login');await settle();s.options[callback]();await assert.rejects(p);assert.equal(s.timers.size,0)}
});
test('non-auth requests never start the security challenge',async()=>{
 const s=setup({fetcher:()=>assert.fail('unexpected security request')});const data={items:['chicken']};assert.equal(await s.api.protect('/grub/conundrum',data),data);
});
