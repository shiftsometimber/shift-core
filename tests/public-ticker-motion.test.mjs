import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {tickerClient,tickerStyles} from '../public-navigation-policy.mjs';
class Element {
 constructor(){this.attrs=new Map();this.dataset={};this.listeners={};this.style={};this.children=[];this.hidden=true;this.clientWidth=390;}
 setAttribute(k,v){this.attrs.set(k,String(v));}
 removeAttribute(k){this.attrs.delete(k);}
 hasAttribute(k){return this.attrs.has(k);}
 getAttribute(k){return this.attrs.get(k);}
 toggleAttribute(k,value){value?this.setAttribute(k,''):this.removeAttribute(k);}
 addEventListener(k,fn){this.listeners[k]=fn;}
 append(e){this.children.push(e);}
 get childElementCount(){return this.children.length;}
 cloneNode(){const e=new Element();e.children=this.children.map(x=>Object.assign(new Element(),x));return e;}
 querySelectorAll(){return this.children;}
 replaceChildren(...e){this.children=e;}
}
async function boot(reduced=false){
 const strip=new Element(),button=new Element(),track=new Element(),label=new Element(),windowElement=new Element();
 strip.querySelector=s=>({'.shift-news-track':track,button,'.shift-news-label':label,'.shift-news-window':windowElement}[s]);
 const motion={matches:reduced,addEventListener(type,fn){this.change=fn;}};
 vm.runInNewContext(tickerClient,{
 document:{readyState:'complete',getElementById:()=>strip,createElement:()=>new Element()},
 window:{matchMedia:()=>motion},
 location:{origin:'https://shiftsometimber.co.uk'},URL,AbortSignal,ResizeObserver:class{observe(){}},
 fetch:async()=>({ok:true,json:async()=>({current:true,items:[{headline:'Test headline',url:'/medicine-news/test'}]})})
 });
 await new Promise(resolve=>setImmediate(resolve));
 return{strip,button,track,motion};
}
test('normal motion starts and repeated pause/play returns to running without removing focus',async()=>{
 const {strip,button,track}=await boot();
 assert.equal(strip.hasAttribute('data-ready'),true);assert.equal(button.hidden,false);
 assert.equal(strip.hasAttribute('data-paused'),false);
 button.listeners.click();assert.equal(strip.hasAttribute('data-paused'),true);assert.equal(button.textContent,'Play');
 button.listeners.click();assert.equal(strip.hasAttribute('data-paused'),false);assert.equal(button.textContent,'Pause');
 assert.equal(button.getAttribute('aria-pressed'),'false');assert.equal(track.children.length,2);
 assert.equal(track.children[1].getAttribute('aria-hidden'),'true');assert.equal(track.children[1].children[0].tabIndex,-1);
});
test('reduced motion starts still with a visible Play control and permits explicit opt-in',async()=>{
 const {strip,button}=await boot(true);
 assert.equal(strip.hasAttribute('data-paused'),true);assert.equal(strip.hasAttribute('data-motion-enabled'),false);
 assert.equal(button.hidden,false);assert.equal(button.textContent,'Play');
 button.listeners.click();assert.equal(strip.hasAttribute('data-motion-enabled'),true);assert.equal(strip.hasAttribute('data-paused'),false);
 button.listeners.click();assert.equal(strip.hasAttribute('data-paused'),true);
});
test('changing the device preference restores the device motion choice',async()=>{
 const {strip,button,motion}=await boot();
 motion.matches=true;motion.change();assert.equal(strip.hasAttribute('data-paused'),true);
 button.listeners.click();assert.equal(strip.hasAttribute('data-motion-enabled'),true);
 motion.change();assert.equal(strip.hasAttribute('data-motion-enabled'),false);assert.equal(button.textContent,'Play');
 motion.matches=false;motion.change();assert.equal(strip.hasAttribute('data-paused'),false);
});
test('automatic pause applies to reading links, never the focused control or touch hover',()=>{
 assert.ok(!tickerStyles.includes('#shift-public-news:focus-within'));
 assert.ok(!tickerStyles.includes('#shift-public-news:hover'));
 assert.ok(tickerStyles.includes('@media(hover:hover) and (pointer:fine)'));
 assert.ok(tickerStyles.includes('.shift-news-window:focus-within'));
 assert.ok(!tickerStyles.includes('.shift-news-pause{display:none}'));
 assert.ok(tickerStyles.includes(':not([data-motion-enabled]) .shift-news-track{animation:none!important'));
});
