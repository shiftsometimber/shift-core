import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('frontend/member/member-product-v33d.js','utf8');
function simulate(path,{ready=false,loading=false}={}){
 let mounted=0,watched=false,callback,domReady;
 const classes=new Set(ready?['member-ready']:[]);
 const document={readyState:loading?'loading':'complete',querySelector:()=>null,querySelectorAll:()=>[],body:{classList:{contains:v=>classes.has(v)}}};
 class Observer{constructor(fn){callback=fn}observe(){watched=true}disconnect(){watched=false}}
 // Isolate startup scheduling from the already separately tested product body.
 const code=source.replace('function bootProduct(){','function bootProduct(){globalThis.recordMount();return;');
 const sandbox={document,location:{pathname:path},recordMount:()=>mounted++,MutationObserver:Observer,window:{addEventListener:(event,fn)=>{if(event==='DOMContentLoaded')domReady=fn}}};
 vm.runInNewContext(code,sandbox);
 return{get mounted(){return mounted},get watched(){return watched},ready(){classes.add('member-ready');callback?.()},dom(){domReady?.()}};
}
test('login and registration aliases never start private product before authenticated reveal',()=>{
 for(const path of ['/member-login','/member-login.html','/member-register','/member-register.html']){const s=simulate(path);assert.equal(s.mounted,0,path);assert.equal(s.watched,true);s.ready();assert.equal(s.mounted,1);assert.equal(s.watched,false);s.ready();assert.equal(s.mounted,1)}
});
test('authenticated embedded entry starts once, while canonical dashboard and retained tools keep existing startup',()=>{
 for(const path of ['/member-login','/member-login.html'])assert.equal(simulate(path,{ready:true}).mounted,1);
 for(const path of ['/member/dashboard','/member/dashboard.html','/member/progress']){const s=simulate(path);assert.equal(s.mounted,1);assert.equal(s.watched,false)}
});
test('DOM readiness does not become an authentication bypass',()=>{
 const s=simulate('/member-login',{loading:true});assert.equal(s.mounted,0);s.dom();assert.equal(s.mounted,0);s.ready();assert.equal(s.mounted,1);
});
