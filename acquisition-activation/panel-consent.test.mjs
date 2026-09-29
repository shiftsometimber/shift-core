import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {consentClient} from './consent.mjs';
function fixture({choice=null,panel=true,foreign=false}={}){
 const callbacks=new Map(),stored=new Map(),events=[],nodes=[],listeners={};let shown=0;
 const owner={location:{origin:foreign?'https://other.invalid':'https://shift.test'},document:{body:{dataset:{memberPage:'dashboard'}}},addEventListener:(n,f)=>callbacks.set(n,f),removeEventListener:n=>callbacks.delete(n)};
 owner.SSTConsent={get:()=>choice,show:()=>shown++,save:v=>{choice=v;callbacks.get('sst:analytics-consent')?.();return v}};
 const node=()=>({style:{},setAttribute(){},addEventListener(){},querySelector:()=>node(),remove(){},appendChild(){}});
 const document={readyState:'complete',body:{dataset:{appPanel:panel?'1':'0'},appendChild:n=>nodes.push(n)},head:{appendChild:n=>nodes.push(n)},createElement:node,getElementById:()=>null};
 const window={parent:owner,frameElement:{closest:()=>panel?{}:null},addEventListener:(n,f)=>listeners[n]=f,dispatchEvent:e=>events.push(e),shiftUpdateGoogleConsent:v=>events.push({google:v})};
 vm.runInNewContext(consentClient,{window,document,location:{origin:'https://shift.test',hash:''},localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)},CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts.detail}},Date});
 return {window,owner,stored,nodes,callbacks,listeners,shown:()=>shown};
}
test('embedded fresh session denies optional tracking without storing an invented choice or mounting a second notice',()=>{const f=fixture();assert.equal(f.window.sstConsent.analytics,false);assert.equal(f.window.sstConsent.acquisition,false);assert.equal(f.nodes.length,0);assert.equal(f.stored.size,0);assert.equal(f.window.SSTConsent.get(),null)});
test('parent grant and withdrawal update loaded panels and Google consent without panel writes',()=>{const f=fixture();f.owner.SSTConsent.save({analytics:true,acquisition:true,acquisitionVersion:'acquisition-v1'});assert.equal(f.window.sstConsent.analytics,true);assert.equal(f.window.sstConsent.acquisition,true);f.owner.SSTConsent.save({analytics:false,acquisition:false});assert.equal(f.window.sstConsent.analytics,false);assert.equal(f.window.sstConsent.acquisition,false);assert.equal(f.stored.size,0)});
test('embedded reopen and save delegate to the containing page; listener is removed on unload',()=>{const f=fixture();f.window.SSTConsent.show();assert.equal(f.shown(),1);f.window.SSTConsent.save({analytics:false,acquisition:true,acquisitionVersion:'acquisition-v1'});assert.equal(f.window.SSTConsent.get().acquisition,true);f.listeners.pagehide();assert.equal(f.callbacks.size,0)});
test('standalone and untrusted framed pages retain their own visible consent interface',()=>{for(const opts of [{panel:false},{foreign:true}]){const f=fixture(opts);assert.equal(f.nodes.length,3);assert.equal(f.callbacks.size,0)}});
