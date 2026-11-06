import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {radarSocialPortal} from '../../radar-social-portal-v1.js';
const source=async()=>{const html=await radarSocialPortal().text();return html.match(/<script>([\s\S]*?)<\/script>/)[1];};
function dom(){const nodes=new Map();const make=()=>({textContent:'',innerHTML:'',hidden:false,attributes:{},replaceChildren(){this.innerHTML='';},setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];},querySelectorAll(){return[];}});return{nodes,document:{querySelector(selector){if(!nodes.has(selector))nodes.set(selector,make());return nodes.get(selector);}}};}
test('The emitted browser program parses, including slash escapes in story paths',async()=>{const script=await source();new vm.Script(script);assert.match(script,/replace\(\/\^\\\//);});
test('A confirmed empty source is distinct from a failed or malformed source',async()=>{
 for(const fixture of [{response:{events:[]},status:200,expected:'No website update is published yet.',retry:false},{response:{error:'TEST unavailable'},status:503,expected:'Unavailable — TEST unavailable',retry:true},{response:{},status:200,expected:'Unavailable — The source did not return a valid update list.',retry:true},{response:{error:'denied'},status:403,expected:'Unavailable — Your role cannot read these updates.',retry:true}]){
  const d=dom();const context={document:d.document,Response,AbortController,setTimeout,clearTimeout,fetch:async()=>new Response(JSON.stringify(fixture.response),{status:fixture.status})};vm.runInNewContext(await source(),context);await new Promise(resolve=>setImmediate(resolve));assert.equal(d.nodes.get('#state').textContent,fixture.expected);assert.equal(d.nodes.get('#retry-load').hidden,!fixture.retry);assert.equal(d.nodes.get('#events').attributes['aria-busy'],undefined);
 }
});
test('A read timeout stops the loader and exposes retry without pretending the source is empty',async()=>{
 const d=dom();let timeout,ms;const context={document:d.document,Response,AbortController,setTimeout:(fn,delay)=>{timeout=fn;ms=delay;return 1;},clearTimeout(){},fetch:async(_url,options)=>new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))))};
 vm.runInNewContext(await source(),context);assert.equal(ms,12000);timeout();await new Promise(resolve=>setImmediate(resolve));assert.match(d.nodes.get('#state').textContent,/Unavailable.*12 seconds/);assert.equal(d.nodes.get('#retry-load').hidden,false);assert.equal(d.nodes.get('#events').attributes['aria-busy'],undefined);
});

test('A source that ignores AbortSignal still stops at the read deadline',async()=>{
 const d=dom();let timeout;const context={document:d.document,Response,AbortController,setTimeout:(fn)=>{timeout=fn;return 1;},clearTimeout(){},fetch:async()=>new Promise(()=>{})};
 vm.runInNewContext(await source(),context);timeout();await new Promise(resolve=>setImmediate(resolve));
 assert.match(d.nodes.get('#state').textContent,/Unavailable.*12 seconds/);assert.equal(d.nodes.get('#retry-load').hidden,false);assert.equal(d.nodes.get('#events').attributes['aria-busy'],undefined);
});
test('An earlier queue result cannot replace a newer read or resurrect cards after lost access',async()=>{
 for(const denied of [false,true]){
  const d=dom();let resolveFirst,calls=0;const context={document:d.document,Response,AbortController,setTimeout,clearTimeout,fetch:async()=>++calls===1?await new Promise(resolve=>{resolveFirst=resolve}):new Response(JSON.stringify(denied?{error:'unauthorised'}:{events:[{id:2,status:'published',headline:'TEST LATEST'}]}),{status:denied?401:200})};
  vm.runInNewContext(await source(),context);await context.load();resolveFirst(new Response(JSON.stringify({events:[{id:1,status:'published',headline:'TEST OLD PRIVATE'}]})));await new Promise(resolve=>setImmediate(resolve));
  assert.ok(!d.nodes.get('#events').innerHTML.includes('TEST OLD PRIVATE'));assert.equal(d.nodes.get('#events').attributes['aria-busy'],undefined);
  if(denied){assert.equal(d.nodes.get('#events').innerHTML,'');assert.match(d.nodes.get('#state').textContent,/Sign in/)}else assert.ok(d.nodes.get('#events').innerHTML.includes('TEST LATEST'));
 }
});
