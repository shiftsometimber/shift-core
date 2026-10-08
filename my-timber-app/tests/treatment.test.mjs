import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../shared/native-treatment.js',import.meta.url),'utf8');
function fixture(origin='https://shiftsometimber.co.uk'){
 const messages=[],calls=[];let next={account:'1',reminders:[]};
 const context={location:{origin,pathname:'/member/treatment'},crypto:{randomUUID:()=>String(messages.length+1)},setTimeout:()=>0,clearTimeout(){},URL,Uint8Array,btoa:s=>Buffer.from(s,'binary').toString('base64'),Event:class{},fetch:async(url,options)=>{calls.push({url:String(url),options});return {ok:true,status:200,json:async()=>next,headers:new Map([['Content-Type','application/pdf']]),arrayBuffer:async()=>Buffer.from('%PDF-1.4\n').buffer}},dispatchEvent(){},sstTreatment:{postMessage(raw){const message=JSON.parse(raw);messages.push(message);queueMicrotask(()=>context.SST_NATIVE_TREATMENT_RESULT({requestId:message.requestId}));}}};context.window=context;context.top=context;vm.runInNewContext(code,context);return {context,messages,calls,setNext:v=>next=v};
}
test('untrusted origin receives no native treatment API',()=>{assert.equal(fixture('https://example.invalid').context.SST_NATIVE_TREATMENT,undefined)});
test('native reminders use an authenticated server lease, not supplied client medical records',async()=>{
 const f=fixture();await new Promise(r=>setImmediate(r));f.setNext({account:'7',reminders:[{id:'fake',at:123}]});await f.context.SST_NATIVE_TREATMENT.sync({treatments:[{medicine:'secret'}]});
 assert.deepEqual(f.messages.at(-1).reminders,[{id:'fake',at:123}]);assert.equal(f.messages.at(-1).account,'7');assert(!JSON.stringify(f.messages).includes('secret'));
 assert.equal(f.calls.at(-1).url,'/v1/member/treatment/native-reminders');assert.equal(f.calls.at(-1).options.credentials,'include');assert.equal(f.calls.at(-1).options.redirect,'error');
});
test('PDF bridge rejects foreign origins and unrelated authenticated URLs',async()=>{const f=fixture();await assert.rejects(f.context.SST_NATIVE_TREATMENT.pdf('https://example.invalid/v1/member/treatment/summary.pdf'));await assert.rejects(f.context.SST_NATIVE_TREATMENT.pdf('/v1/me'));});
