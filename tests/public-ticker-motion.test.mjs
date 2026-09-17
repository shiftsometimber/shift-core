import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {tickerClient,tickerStyles,withPublicTicker} from '../public-navigation-policy.mjs';
class Element {
 constructor(){this.attrs=new Map();this.dataset={};this.style={};this.children=[];this.clientWidth=390;}
 setAttribute(k,v){this.attrs.set(k,String(v));}
 hasAttribute(k){return this.attrs.has(k);}
 getAttribute(k){return this.attrs.get(k);}
 append(e){this.children.push(e);}
 get childElementCount(){return this.children.length;}
 cloneNode(){const e=new Element();e.children=this.children.map(x=>Object.assign(new Element(),x));return e;}
 querySelectorAll(){return this.children;}
 replaceChildren(...e){this.children=e;}
}
async function boot(body){
 const strip=new Element(),track=new Element(),label=new Element(),windowElement=new Element();
 strip.querySelector=s=>({'.shift-news-track':track,'.shift-news-label':label,'.shift-news-window':windowElement}[s]);
 vm.runInNewContext(tickerClient,{
 document:{readyState:'complete',getElementById:()=>strip,createElement:()=>new Element()},
 location:{origin:'https://shiftsometimber.co.uk'},URL,AbortSignal,ResizeObserver:class{observe(){}},
 fetch:async()=>({ok:true,json:async()=>body})
 });
 await new Promise(resolve=>setImmediate(resolve));
 return{strip,track,label};
}
test('published headlines start automatically without needing a button or user action',async()=>{
 const {strip,track,label}=await boot({current:false,published_edition:{current_wire:false,edition_id:'fixture',items:[{headline:'Test headline',url:'/medicine-news/test',published_at:'2026-09-16'}]}});
 assert.equal(strip.hasAttribute('data-ready'),true);
 assert.equal(label.textContent,'Published in SHIFT');
 assert.equal(track.children.length,2);
 assert.equal(track.children[1].getAttribute('aria-hidden'),'true');assert.equal(track.children[1].children[0].tabIndex,-1);
 assert.match(track.children[0].children[0].textContent,/Published/);
});
test('a missing publication feed retains honest static navigation rather than invented news',async()=>{
 const {strip,track}=await boot({current:false,items:[]});
 assert.equal(strip.hasAttribute('data-ready'),false);assert.equal(track.children.length,0);
});
test('public markup has no playback controls and motion cannot stick on ordinary focus or touch hover',async()=>{
 const html=await(await withPublicTicker(new Request('https://shiftsometimber.co.uk/treatment-centre'),new Response('<html><head></head><body><header>Header</header><main>Content</main></body></html>',{headers:{'Content-Type':'text/html'}}))).text();
 assert.ok(!html.includes('<button'));assert.ok(!tickerClient.includes('button'));
 assert.ok(!tickerStyles.includes('#shift-public-news:focus-within'));
 assert.ok(!tickerStyles.includes('#shift-public-news:hover'));
 assert.ok(tickerStyles.includes('@media(hover:hover) and (pointer:fine)'));
 assert.ok(tickerStyles.includes(':has(a:focus-visible)'));
 assert.ok(tickerStyles.includes('@media(prefers-reduced-motion:reduce)'));
 assert.ok(tickerStyles.includes('animation:shiftPublicNews 90s linear infinite'));
});
