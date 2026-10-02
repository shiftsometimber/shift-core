import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';
import {connectedHealthRuntime} from '../connected-health.mjs';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture(){
 const elements=new Map(),listeners=new Map();
 for(const id of ['connectedHealthPanel','connectedHealthState','connectedHealthActions','connectedHealthConnect','connectedHealthDisconnect','connectedHealthLatest','connectedHealthReadings'])elements.set(id,{dataset:{},hidden:false,textContent:'',children:[],attributes:{},listeners:{},addEventListener(type,fn){this.listeners[type]=fn},replaceChildren(){this.children=[]},append(...items){this.children.push(...items)},setAttribute(name,value){this.attributes[name]=value},removeAttribute(name){delete this.attributes[name]}});
 const source={status:{trackingEnabled:true,connections:[{platform:'apple_health',enabled:true,lastSyncAt:'2026-10-02T12:00:00Z'}]},data:{latest:{steps:{value:8000,unit:'count',observedAt:'2026-10-01T20:00:00Z'}}},fail:false};
 const document={hidden:false,getElementById:id=>elements.get(id),createElement:tag=>({tag,textContent:''}),addEventListener(type,fn){listeners.set('document:'+type,fn)}};
 vm.runInNewContext(connectedHealthRuntime,{document,navigator:{userAgent:'iPhone MyTimber/1.1.0'},window:{addEventListener(type,fn){listeners.set(type,fn)}},AbortSignal,Date,confirm:()=>true,setTimeout:fn=>fn(),fetch:async path=>{if(source.fail)throw Error('Synthetic network failure');return{ok:true,json:async()=>path.endsWith('/status')?source.status:source.data}}});
 await tick();return{elements,source,listeners,async refresh(){listeners.get('focus')();await tick()}};
}
test('old daily totals have observation dates and are not labelled today',async()=>{
 const f=await fixture();const rows=f.elements.get('connectedHealthReadings').children;
 assert.equal(rows[0].textContent,'Steps');assert.match(rows[1].textContent,/recorded/);assert.doesNotMatch(rows[0].textContent,/today/i);
});
test('withdrawing consent clears and hides previously rendered readings',async()=>{
 const f=await fixture();assert.equal(f.elements.get('connectedHealthLatest').hidden,false);
 f.source.status.trackingEnabled=false;f.source.data={latest:{}};await f.refresh();
 assert.equal(f.elements.get('connectedHealthLatest').hidden,true);assert.equal(f.elements.get('connectedHealthReadings').children.length,0);assert.match(f.elements.get('connectedHealthState').textContent,/tracking is off/);
});
test('native denial/failure feedback persists through focus refresh without claiming connection',async()=>{
 const f=await fixture();const message='No recent readings were shared. Check the selected permissions.';
 await f.listeners.get('myTimberHealthSync')({detail:{message,success:false}});await f.refresh();
 assert.equal(f.elements.get('connectedHealthState').textContent,message);
});
test('repeat taps do not launch another health flow until a native result returns',async()=>{
 const f=await fixture();const connect=f.elements.get('connectedHealthConnect');let prevented=0;
 connect.listeners.click({preventDefault(){prevented++}});connect.listeners.click({preventDefault(){prevented++}});assert.equal(prevented,1);
 await f.listeners.get('myTimberHealthSync')({detail:{message:'Setup closed.',success:false}});connect.listeners.click({preventDefault(){prevented++}});assert.equal(prevented,1);
});
test('failed refresh hides stale readings rather than leaving them as current',async()=>{
 const f=await fixture();f.source.fail=true;await f.refresh();assert.equal(f.elements.get('connectedHealthLatest').hidden,true);assert.equal(f.elements.get('connectedHealthReadings').children.length,0);assert.match(f.elements.get('connectedHealthState').textContent,/network failure/);
});
