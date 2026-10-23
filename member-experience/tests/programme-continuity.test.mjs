import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../programme-client.js',import.meta.url),'utf8');
async function app({path='/member/grub',kind='food',approach='meal-guide',embedded=false}={}){
 const handlers={},attrs=new Set(),host={},messages=[],frame={contentWindow:{postMessage:(...args)=>messages.push(args)}},toolFrame={src:''};let selected=0;
 const anchor={prepend(e){e.parentElement=this}},tab={click(){selected++}};
 const element=()=>({setAttribute(){},addEventListener(){},insertAdjacentHTML(position,html){this.innerHTML+=html},...host});
 const location=new URL('https://shiftsometimber.co.uk'+path),data={progress:{revision:2,programme:{},nextShift:{kind,approach,title:'Build an easy meal from what you have'}},programme:{reason:'More energy for the family',smallWin:'Take a short walk',week:1}};
 const document={body:{toggleAttribute:(k,on)=>on?attrs.add(k):attrs.delete(k),removeAttribute:k=>attrs.delete(k),append(){}},createElement:element,querySelector(s){if(s==='main')return anchor;if(s==='#appTab-grub')return tab;if(s==='#appTool-grub iframe')return toolFrame;return null},querySelectorAll:()=>[frame],addEventListener(){}};
 const window={addEventListener:(name,fn)=>handlers[name]=fn};window.parent=embedded?{}:window;
 const context={document,window,location,URL,URLSearchParams,AbortController,setTimeout,clearTimeout,fetch:async()=>({ok:true,json:async()=>data})};
 // Keep the actual created panel so assertions exercise production rendering.
 let made=0;document.createElement=()=>{const e=element();if(made++===0)context.panel=e;return e};
 vm.runInNewContext(source,context);await new Promise(resolve=>setImmediate(resolve));
 return {context,handlers,attrs,toolFrame,messages,selected:()=>selected,html:()=>context.panel.innerHTML};
}
test('a saved meal-guide approach appears even when the shell discarded URL parameters',async()=>{const a=await app();assert.match(a.html(),/Build an easy meal\./);assert.match(a.html(),/href="\/member\/dashboard#dailyCheckinFollowup" target="_top"/);assert(a.attrs.has('data-programme-ready'))});
test('Fit carries the member reason rather than an unrelated food step',async()=>{const a=await app({path:'/member/fit'});assert.match(a.html(),/More energy for the family/);assert.doesNotMatch(a.html(),/Build an easy meal/)});
test('accepted guide links open the existing Grub tab with the guide parameters intact',async()=>{const a=await app({path:'/member/dashboard'});let prevented=false,stopped=false;const link={href:'https://shiftsometimber.co.uk/member/grub?approach=meal-guide&shift=test-id'};a.handlers.click({target:{closest:()=>link},button:0,preventDefault(){prevented=true},stopImmediatePropagation(){stopped=true}});assert(prevented&&stopped);assert.equal(a.selected(),1);const u=new URL(a.toolFrame.src,'https://shiftsometimber.co.uk');assert.equal(u.searchParams.get('approach'),'meal-guide');assert.equal(u.searchParams.get('shift'),'test-id');assert.equal(u.searchParams.get('app_panel'),'1')});
test('external links and modified clicks keep their normal behaviour',async()=>{for(const [href,ctrlKey]of [['https://example.com/member/grub?approach=meal-guide',false],['https://shiftsometimber.co.uk/member/grub?approach=meal-guide',true]]){const a=await app({path:'/member/dashboard'});a.handlers.click({target:{closest:()=>({href})},button:0,ctrlKey,preventDefault(){assert.fail('Should not intercept')},stopImmediatePropagation(){assert.fail('Should not stop')}})}});
test('panel refresh sends no account answers and only the parent initiates broadcasts',async()=>{const a=await app();assert.equal(a.messages.length,1);assert.equal(JSON.stringify(a.messages[0]),JSON.stringify([{type:'sst:programme-refresh'},'https://shiftsometimber.co.uk']));const child=await app({embedded:true});assert.equal(child.messages.length,0)});
