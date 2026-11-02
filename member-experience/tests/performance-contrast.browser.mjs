import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {optimiseMemberContrastGuard} from '../performance-delivery.mjs';
const require=createRequire(import.meta.url),engines=require('/Users/shiftsometimberltd/SST/tools/apple-review-smoke/node_modules/playwright');
const captured=JSON.parse(readFileSync(existsSync('performance-browser-pages.json')?'performance-browser-pages.json':new URL('../journey-shop-release-20261031/performance-browser-pages.json',import.meta.url)));
const original=captured['/member/dashboard?view=app'].match(/<script\b[^>]*data-shift-contrast-guard=["']public-contrast-20260917-r2["'][^>]*>[\s\S]*?<\/script>/i)[0],updated=optimiseMemberContrastGuard(original);
assert.notEqual(original,updated);assert.equal(optimiseMemberContrastGuard(updated),updated);
const fixtures='<!doctype html><html><head><style>body{margin:0;background:#E7E3DA;color:#050505;font:16px Arial} .card{background:#E7E3DA;color:#E7E3DA;padding:5px} .good{background:#E7E3DA;color:#050505} .tiny{display:block;width:.5px;height:.5px;overflow:hidden} .flip{background:#050505;color:#050505}</style></head><body><main>'+Array.from({length:700},(_,i)=>'<div><section><p class="good">Existing readable content '+i+'</p></section></div>').join('')+'<div id="bad" class="card">Unreadable text <span id="nested" style="background:#050505;color:inherit">Nested colour</span></div><button id="button" class="card">A button</button><input id="input" class="card" value="A control"><div style="background:#E7E3DA"><p id="alpha" style="background:rgba(255,255,255,.3);color:rgba(231,227,218,.9)">Alpha background</p></div><p id="hidden" class="card" hidden>Hidden until needed</p><p id="tiny" class="card tiny">Tiny element</p><p id="opacity" class="card" style="opacity:.01">Transparent</p><p id="image" class="card" style="background-image:linear-gradient(#000,#fff)">Image background</p><p id="dynamic" class="good">Class change</p><div id="added"></div></main></body></html>';
const reports=[];
for(const engine of ['chromium','webkit']){
 const browser=await engines[engine].launch({headless:true});let context;
 try{
  context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const results=[];
  for(const [version,script] of [['before',original],['after',updated]]){
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.setContent(fixtures);
   await page.evaluate(()=>{window.__contrastGeometryReads=0;const old=Element.prototype.getBoundingClientRect;Element.prototype.getBoundingClientRect=function(...args){window.__contrastGeometryReads++;return old.apply(this,args);};});
   await page.addScriptTag({content:script.replace(/^<script[^>]*>/,'').replace(/<\/script>$/,'')});
   await page.waitForTimeout(250);
   const initialReads=await page.evaluate(()=>window.__contrastGeometryReads);
   const capture=()=>page.evaluate(()=>Object.fromEntries(['bad','nested','button','input','alpha','hidden','tiny','opacity','image','dynamic','added','newText'].flatMap(id=>{const e=document.getElementById(id);if(!e)return[];const s=getComputedStyle(e),r=e.getBoundingClientRect();return[[id,{text:e.textContent,value:e.value||'',colour:s.color,textFill:s.webkitTextFillColor,display:s.display,visibility:s.visibility,x:r.x,y:r.y,width:r.width,height:r.height,guard:e.dataset.shiftContrastGuard||null}]];})));
   const first=await capture();
   await page.evaluate(()=>{document.getElementById('hidden').hidden=false;document.getElementById('dynamic').className='flip';document.getElementById('added').innerHTML='<p id="newText" class="card">New text</p>';});
   await page.waitForTimeout(250);const changed=await capture();assert.deepEqual(errors,[]);
   results.push({version,initialReads,first,changed});await page.close();
  }
  assert.deepEqual(results[1].first,results[0].first,'Initial text colours and layout must match');
  assert.deepEqual(results[1].changed,results[0].changed,'Reveal, added text and class changes must match');
  assert(results[1].initialReads<results[0].initialReads*.25,'Geometry reads must fall by at least 75%');
  reports.push({engine,verified:true,geometryReadsBefore:results[0].initialReads,geometryReadsAfter:results[1].initialReads,initialAndDynamicElementsCompared:Object.keys(results[0].first).length+Object.keys(results[0].changed).length,productionRequests:0,productionWrites:0});
 }finally{await context?.close();await browser.close();}
}
writeFileSync('performance-contrast-browser-proof.json',JSON.stringify({at:new Date().toISOString(),verified:true,sourceFileSHA256:createHash('sha256').update(readFileSync(new URL('../performance-delivery.mjs',import.meta.url))).digest('hex'),reports},null,2)+'\n');
console.log('CONTRAST_PARITY_AND_GEOMETRY',JSON.stringify(reports));
