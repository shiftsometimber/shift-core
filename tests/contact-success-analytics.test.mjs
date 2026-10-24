import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../worker-entry-v6.js',import.meta.url),'utf8');
const match=source.match(/const ACT2B_CONTACT_DIRECT_SUBMIT = `([\s\S]*?)`;/);
assert.ok(match,'Existing exact contact handler must be present');
const script=vm.runInNewContext('`'+match[1]+'`');

function harness({status=201,body={ok:true,message:'Accepted'},token='synthetic-token'}={}){
 const events=[],requests=[];
 class Form {
  constructor(){
   this.values={name:'Fictional Tester',email:'fictional@example.invalid',subject:'General question',message:'Synthetic only'};
   this.elements={namedItem:key=>key in this.values?{value:this.values[key]}:null};
   this.button={textContent:'Send securely',disabled:false,tagName:'BUTTON'};
   this.status={textContent:'',dataset:{}};
   this.resets=0;
  }
  querySelector(selector){
   if(selector.startsWith('button[type='))return this.button;
   if(selector.includes('data-shift-contact-status'))return this.status;
   if(selector.includes('checkbox:checked'))return {checked:true};
   if(selector==='textarea')return {value:this.values.message};
   return null;
  }
  reset(){this.resets++}
 }
 const form=new Form(),listener={};
 const context={
  location:{pathname:'/contact',search:''},URLSearchParams,Error,Set,String,
  HTMLFormElement:Form,
  document:{addEventListener:(name,fn)=>{listener[name]=fn},createElement:()=>{throw Error('unwanted DOM mutation')}},
  window:{SSTTurnstile:{getToken:async()=>token},SSTAnalytics:{track:(name,properties)=>events.push({name,properties})}},
  fetch:async(url,opts)=>{requests.push({url,opts});return{ok:status<400,status,json:async()=>body}}
 };
 vm.runInNewContext(script,context);
 assert.equal(typeof listener.submit,'function');
 const event={target:form,preventDefault(){},stopImmediatePropagation(){}};
 return{form,events,requests,submit:async()=>listener.submit(event)};
}

test('successful backend acknowledgement emits one consent-gated contact success event, no PII',async()=>{
 const h=harness();await h.submit();
 assert.equal(h.requests.length,1);assert.equal(h.requests[0].url,'/v1/contact');
 assert.equal(h.form.resets,1);assert.equal(h.form.status.dataset.state,'success');
 assert.equal(h.events.length,1);assert.equal(h.events[0].name,'contact_submit');
 assert.equal(h.events[0].properties.enquiry_type,'general');
 assert.doesNotMatch(JSON.stringify(h.events),/fictional|Tester|synthetic|email|message/);
});

test('backend delivery failure does not emit a false conversion or clear the form',async()=>{
 const h=harness({status:503,body:{ok:false,message:'Delivery unavailable'}});await h.submit();
 assert.equal(h.form.status.dataset.state,'error');assert.equal(h.form.resets,0);assert.equal(h.events.length,0);
});

test('security failure does not issue a submission or record a conversion',async()=>{
 const h=harness({token:null});await h.submit();
 assert.equal(h.requests.length,0);assert.equal(h.events.length,0);
 assert.equal(h.form.status.dataset.state,'error');
});

test('success for partnership maps only to an approved generic event category',async()=>{
 const h=harness();h.form.values.subject='Partnership';await h.submit();
 assert.equal(h.events[0].properties.enquiry_type,'partnership');
});
