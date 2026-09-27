import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {acquisitionClient} from './client.mjs';
const consent=()=>({analytics:false,acquisition:true,acquisitionVersion:'acquisition-v1',updatedAt:new Date(Date.now()-1).toISOString()});
function browser({path='/programme?utm_source=google&utm_medium=organic',referrer='',stored=new Map(),choice=consent()}={}){
 if(choice)stored.set('sstConsentV3',JSON.stringify(choice));const listeners={};const w={addEventListener(n,f){listeners[n]=f}};
 const ls={getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)};
 const context=vm.createContext({window:w,document:{referrer},location:new URL('https://shiftsometimber.co.uk'+path),URL,Date,localStorage:ls,fetch:()=>{throw Error('unexpected_network')}});
 vm.runInContext(acquisitionClient,context);return{stored,api:w.SSTAcquisition,listeners,w};
}
test('old Google consent is not silently upgraded to account-linked consent',()=>{const b=browser({choice:{analytics:true}});assert.equal(b.api.registration(),null);assert.equal(b.stored.has('sstAcquisitionV1'),false)});
test('new SHIFT-only consent keeps only source/medium and bounded timestamps',()=>{const b=browser({path:'/programme?utm_source=google&utm_medium=organic&utm_campaign=health-detail&email=not-retained'}),v=b.api.registration();assert.equal(v.source,'google');assert.equal(v.medium,'organic');assert.doesNotMatch(JSON.stringify(v),/health-detail|not-retained|campaign|email/)});
test('first consented source survives navigation and later tagged links without overwriting',()=>{const a=browser(),before=JSON.stringify(a.api.registration());const b=browser({path:'/start-here?utm_source=newsletter&utm_medium=email',stored:a.stored});assert.equal(JSON.stringify(b.api.registration()),before);const c=browser({path:'/member-login?next=/member/dashboard',stored:b.stored});assert.equal(JSON.stringify(c.api.registration()),before)});
test('successful registration/login consumption removes the browser source for later account use',()=>{const a=browser();a.api.consumed();assert.equal(a.api.registration(),null);assert.equal(browser({path:'/member-login',stored:a.stored}).api.registration(),null)});
test('unsupported, duplicated or mismatched tags never become a named source',()=>{for(const path of ['/programme?utm_source=unknown&utm_medium=cpc','/programme?utm_source=google&utm_source=email&utm_medium=organic','/programme?utm_source=google&utm_medium=email'])assert.equal(browser({path}).api.registration(),null)});
test('private and encoded account routes do not collect a new source',()=>{for(const path of ['/member/dashboard','/member-login.html','/my-timber.html','/%6dember-login','/v1/me','/treatment-order?utm_source=google&utm_medium=cpc'])assert.equal(browser({path}).api.registration(),null)});
test('search referrer classification stores no referring URL or search term',()=>{const b=browser({path:'/programme',referrer:'https://www.google.co.uk/search?q=private-health-question'});assert.equal(b.api.registration().source,'google');assert.doesNotMatch(JSON.stringify(b.api.registration()),/private-health|https|search/)});
test('missing referrer is explicitly direct-or-unknown, and internal referral is not miscredited',()=>{assert.equal(browser({path:'/programme'}).api.registration().source,'direct_or_unknown');assert.equal(browser({path:'/programme',referrer:'https://shiftsometimber.co.uk/start-here'}).api.registration(),null)});
test('expired, tampered and rejected-consent records cannot be submitted',()=>{const b=browser();const v=b.api.registration();v.capturedAt='2000-01-01';b.stored.set('sstAcquisitionV1',JSON.stringify(v));assert.equal(b.api.registration(),null);const c=browser();c.stored.set('sstConsentV3',JSON.stringify({acquisition:false}));assert.equal(c.api.registration(),null)});
