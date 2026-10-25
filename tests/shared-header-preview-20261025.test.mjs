import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {RETA_STYLES} from '../reta-styles-data.mjs';
import {HOME_BLOCKING_STYLES} from '../home-blocking-styles.mjs';
import {originalHeaderPreviewCss,SHARED_HEADER_PRESENTATION as approved,APPROVED_SHARED_HEADER_SUFFIX as suffix} from '../release/shared-header-preview-20261025.mjs';
const path='/assets/header-navigation-v2.css',base={...RETA_STYLES,...HOME_BLOCKING_STYLES}[path],presented=base+suffix;
test('exact separately approved shared header composes before the untouched original preview hash',()=>{
 assert.equal(createHash('sha256').update(base).digest('hex'),'74b8c12bc157dfab638bb1202a3358d12b6a47bd5932c5df5480a1c887a3ef6d');
 assert.equal(originalHeaderPreviewCss(path,presented,base),base);
 assert.equal(approved.approvedSource,'0c9e50db082f706c27115a0e9d056c0277d7b11b');assert.equal(approved.originalExpectedHashChanged,false);
});
test('changed prefix suffix new bytes and removal of the already approved header all fail closed',()=>{
 for(const actual of[base,presented+'\n',presented.slice(1),presented.replace('One homepage component','Changed homepage component'),presented.replace('#E7E3DA','#E7E3DB')])assert.throws(()=>originalHeaderPreviewCss(path,actual,base));
 for(const expected of[base+'\n',base.slice(1)])assert.throws(()=>originalHeaderPreviewCss(path,presented,expected));
 assert.throws(()=>originalHeaderPreviewCss(path,null,base));assert.throws(()=>originalHeaderPreviewCss(path,presented,null));
});
test('every unrelated CSS body remains untouched for its original comparison',()=>{
 for(const path of['/assets/my-timber-pwa.css','/assets/home-critical.css','/other'])assert.equal(originalHeaderPreviewCss(path,'changed actual','expected'),'changed actual');
});

import {originalHeaderPreviewFetch,originalHeaderPreviewCommandEnv} from '../release/shared-header-preview-20261025.mjs';
import {readFileSync} from 'node:fs';
test('original fetch request response identity metadata body consumption and errors survive the single exact CSS read adapter',async()=>{
 const raw=new Response(presented,{headers:{'x-owned':'kept'}}),args=[];
 const fetch=originalHeaderPreviewFetch(async(...values)=>{args.push(values);return raw},base);
 const response=await fetch('https://shiftsometimber.co.uk'+path);assert.equal(response,raw);assert.equal(response.headers.get('x-owned'),'kept');assert.equal(response.status,200);assert.deepEqual(args,[['https://shiftsometimber.co.uk'+path,undefined]]);assert.equal(await response.text(),base);assert.equal(response.bodyUsed,true);await assert.rejects(response.text(),TypeError);
 const sentinel=Error('Original network failure');await assert.rejects(originalHeaderPreviewFetch(async()=>{throw sentinel},base)('https://shiftsometimber.co.uk'+path),error=>error===sentinel);
});
test('other origins paths query strings and non-GET calls remain original by identity with no text rewrite',async()=>{
 for(const[input,init]of[['https://elsewhere.invalid'+path],['https://shiftsometimber.co.uk/other'],['https://shiftsometimber.co.uk'+path+'?unowned'],['https://shiftsometimber.co.uk'+path,{method:'POST'}]]){const raw=new Response('original body');const fetch=originalHeaderPreviewFetch(async()=>raw,base);assert.equal(await fetch(input,init),raw);assert.equal(await raw.text(),'original body');}
});
test('only the exact original production command gets a child-local preload; original environment and task stay immutable',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../release/production-source-schedule-20261016.json',import.meta.url),'utf8')),task=manifest.tasks.find(t=>t.id==='production-step-007'),copy=structuredClone(task),env=Object.freeze({SHIFT_ORIGINAL_SOURCE_SCOPE:'1',NODE_OPTIONS:'--no-warnings',OTHER:'kept'});
 for(const[otherTask,pool]of[[{id:'other',body:'original'},'production-bounded'],[task,'privacy-bounded']])assert.equal(originalHeaderPreviewCommandEnv(otherTask,env,pool),env);
 const child=originalHeaderPreviewCommandEnv(task,env,'production-bounded');assert.notEqual(child,env);assert.equal(child.OTHER,'kept');assert.match(child.NODE_OPTIONS,/^--no-warnings --import=file:.*shared-header-preview-preload-20261025\.mjs$/);assert.equal(child.SHIFT_SHARED_HEADER_PREVIEW_ONLY,'exact-original-production-step-007');assert.deepEqual(task,copy);assert.equal(env.NODE_OPTIONS,'--no-warnings');
 assert.throws(()=>originalHeaderPreviewCommandEnv({...task,body:task.body+'\n'},env,'production-bounded'));assert.throws(()=>originalHeaderPreviewCommandEnv(task,{},'production-bounded'));
});
