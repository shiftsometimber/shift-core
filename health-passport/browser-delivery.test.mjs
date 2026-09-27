import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {build} from 'esbuild';
import {passportClient} from './client.mjs';
import {passportAssets} from './presentation.mjs';
const KEY='sst_start_here_handoff_v1',origin='https://shiftsometimber.co.uk';
function browser(source){
 const stored=new Map(),handlers=[];
 const input={checked:false,addEventListener(){}},last={hidden:false,querySelector:()=>null,append(){}},box={querySelector:()=>input};
 const document={readyState:'complete',querySelector:s=>s==='[data-quick-step="2"]'?last:null,createElement:()=>box,addEventListener:(name,fn)=>{if(name==='click')handlers.push(fn)}};
 const sandbox={document,location:{origin,pathname:'/start-here'},URL,URLSearchParams,Date,console,crypto,sessionStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)},setTimeout:()=>1,clearTimeout(){}};
 vm.runInNewContext(source,sandbox);
 const draft=(delta=0)=>{const at=Date.now()+delta;stored.set(KEY,JSON.stringify({accountId:null,draft:{version:1,id:crypto.randomUUID(),createdAt:new Date(at).toISOString(),expiresAt:new Date(at+1800000).toISOString(),answers:{why:['Lose weight'],med:['No medication'],access:['NHS'],budget:['£0 / NHS']}}}))};
 const click=href=>{const anchor={href};const event={target:{closest:selector=>selector==='a[href]'?anchor:null}};for(const h of handlers)h(event);return anchor.href};
 return{stored,draft,click};
}
test('deployed Worker bundling preserves Passport browser bytes and boot without server helpers',async()=>{
 const result=await build({entryPoints:['health-passport/presentation.mjs'],bundle:true,format:'esm',keepNames:true,write:false});
 const module=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
 const request=new Request(origin+'/assets/member-experience/passport.js'),env={HEALTH_PASSPORT_V1_ENABLED:'true',MEMBER_EXPERIENCE_V1_ENABLED:'true'};
 const actual=await module.passportAssets(request,env).text(),expected=await passportAssets(request,env).text();
 assert.equal(actual,expected);assert.equal(actual,passportClient);assert.doesNotMatch(actual,/\b__name\b/);browser(actual);
});
test('only a valid opted-in draft adds the canonical dashboard return to ordinary member login',()=>{
 const b=browser(passportClient);assert.equal(b.click('/member-login'),'/member-login');b.draft();
 const link=new URL(b.click('/member-login?source=start'),origin);assert.equal(link.pathname,'/member-login');assert.equal(link.searchParams.get('source'),'start');assert.equal(link.searchParams.get('next'),'/member/dashboard?passport=1#journey');
 assert.equal(link.search.includes('Lose'),false);assert.equal(link.search.includes('NHS'),false);assert.equal(b.stored.size,1);
});
test('existing return destinations, external links and medicine destinations are never rewritten',()=>{
 const b=browser(passportClient);b.draft();
 for(const href of ['/member-login?next=%2Fmember%2Fsettings','/member-login?returnTo=%2Fmember%2Fgrub','https://elsewhere.example/member-login','/treatment-order?medicine=mounjaro','/member/dashboard'])assert.equal(b.click(href),href);
});
test('expired or malformed draft cannot alter login or be retained',()=>{
 const b=browser(passportClient);b.draft(-3600000);assert.equal(b.click('/member-login'),'/member-login');assert.equal(b.stored.size,0);
 b.stored.set(KEY,'malformed');assert.equal(b.click('/member-login'),'/member-login');assert.equal(b.stored.size,0);
});
