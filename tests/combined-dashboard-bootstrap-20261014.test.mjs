import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {withCoaching as current} from '../shift-coach/presentation.mjs';
import {readFileSync} from 'node:fs';
const originalSource=JSON.parse(readFileSync(new URL('../release/combined-dashboard-original-20261014.json',import.meta.url),'utf8')).originalText.replace(/from (['"])(\.{1,2}\/[^'"]+)\1/g,(_,quote,path)=>'from '+quote+new URL(path,new URL('../shift-coach/presentation.mjs',import.meta.url)).href+quote);
const {withCoaching:original}=await import('data:text/javascript;base64,'+Buffer.from(originalSource).toString('base64'));
import {inlineBootstrap} from '../cream-navigation.mjs';
import {bootstrap} from '../activation-measurement/assets.mjs';
import {PUBLIC_HEADERS} from '../babylove/response-policy.mjs';
const tag='<script src="/analytics-bootstrap-v1.js"></script>';
const source='<html><head><meta charset="utf-8"><script data-before>window.order=["before"];</script>'+tag+'<script data-after>window.order.push(typeof window.shiftUpdateGoogleConsent,typeof window.SSTAcquisition.registration,window["ga-disable-G-Y7BV5KY6RR"]);</script></head><body><section id="previewMember" hidden><div id="todayActions">Original tools</div></section></body></html>';
const seed={version:1,status:'ready',message:'Synthetic checked fixture'};
const origin='https://shiftsometimber.co.uk';
const headers={'Content-Type':'text/html',...PUBLIC_HEADERS,Link:'</existing.css>; rel=preload; as=style'};
async function render(fn,{html=source,path='/member/dashboard',method='GET',status=200,checked=seed,gzip=false,type='text/html'}={}) {
 const request=new Request(origin+path,{method,headers:gzip?{'Accept-Encoding':'gzip'}:{}});
 const response=await fn(request,new Response(html,{status,headers:{...headers,'Content-Type':type}}),checked);
 const text=gzip?await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).text():await response.text();
 return{response,text};
}
test('only the one existing head bootstrap changes; all other output and headers stay identical',async()=>{
 const old=await render(original),now=await render(current);
 assert.equal(now.text.replace(inlineBootstrap,tag),old.text);
 assert.deepEqual([...now.response.headers],[...old.response.headers]);
 assert.equal(now.text.split(inlineBootstrap).length,2);
 assert.equal(now.text.indexOf(inlineBootstrap),old.text.indexOf(tag));
 assert.equal(inlineBootstrap,'<script data-shift-inline-bootstrap>'+bootstrap+'</script>');
 const csp=now.response.headers.get('Content-Security-Policy');
 assert.match(csp,/script-src[^;]*'unsafe-inline'/);
 assert.equal(csp,old.response.headers.get('Content-Security-Policy'));
});
test('gzip still wraps the exact same expected HTML and preserves headers',async()=>{
 const old=await render(original,{gzip:true}),now=await render(current,{gzip:true});
 assert.equal(now.text.replace(inlineBootstrap,tag),old.text);
 assert.deepEqual([...now.response.headers],[...old.response.headers]);
 assert.equal(now.response.headers.get('Content-Encoding'),'gzip');
});
test('anonymous, other paths, methods and non-200/non-HTML responses keep original output',async()=>{
 for(const opts of [{checked:null},{path:'/'},{path:'/hq'},{path:'/member/email-change'},{method:'POST'},{status:401},{type:'text/plain'}]) {
  const old=await render(original,opts),now=await render(current,opts);
  assert.equal(now.text,old.text,JSON.stringify(opts));assert.deepEqual([...now.response.headers],[...old.response.headers]);
 }
});
test('missing, duplicate, non-head and already-inline bootstrap markup keep original behaviour',async()=>{
 for(const html of [source.replace(tag,''),source.replace(tag,tag+tag),source.replace(tag,'').replace('</body>',tag+'</body>'),source.replace(tag,inlineBootstrap)]) {
  const old=await render(original,{html}),now=await render(current,{html});
  assert.equal(now.text,old.text);assert.deepEqual([...now.response.headers],[...old.response.headers]);
 }
});
test('denial and acquisition callbacks exist before the next script; private dashboard never loads GTM',async()=>{
 const now=await render(current),injected=[],listeners={};
 const data=new Map([['sstConsentV3',JSON.stringify({analytics:true})]]);
 const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 const win={dataLayer:[],addEventListener(n,fn){(listeners[n]??=[]).push(fn)}};
 const location=new URL(origin+'/member/dashboard'),document={head:{appendChild(el){injected.push(el)}},referrer:'',createElement(){return{}}};
 const context={window:win,document,location,localStorage:storage,sessionStorage:storage,URL,URLSearchParams,Date};vm.createContext(context);
 const head=now.text.match(/<head[\s\S]*?<\/head>/)[0];
 for(const script of head.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))vm.runInContext(script[1],context);
 assert.deepEqual([...win.order],['before','function','function',true]);
 assert.equal(win.SST_ANALYTICS_SUPPRESSED,true);assert.equal(injected.length,0);
 win.shiftUpdateGoogleConsent(true);win.shiftUpdateGoogleConsent(false);
 for(const fn of listeners['sst:analytics-consent']||[])fn({detail:{analytics:true}});
 assert.equal(injected.length,0);
 const first=win.dataLayer.find(v=>v[0]==='consent');
 assert.equal(first[1],'default');assert.equal(first[2].analytics_storage,'denied');assert.equal(first[2].ad_storage,'denied');
 assert.equal(win.SSTAcquisition.registration(),null);
});
