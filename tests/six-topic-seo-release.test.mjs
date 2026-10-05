import test from 'node:test';import assert from 'node:assert/strict';
import {SIX_TOPIC_SEO_SOURCE,SIX_TOPIC_SEO_PATHS,validateSixTopicSeoSource,verifySixTopicSeoProof} from '../release/six-topic-seo-scope.mjs';
import {preserveSixTopicSeo,originalSixTopicSeoPreservation} from '../release/six-topic-seo-preservation.mjs';
import {withSixTopicGuides} from '../public-seo-closeout.mjs';
import {SEO_FIT_COMPOSITION_PATHS,validateSeoFitComposition} from '../release/fit-300-scope.mjs';
test('combined SEO and Fit source rejects any guard drift or broadened composition',()=>{
 const composition={proof:'SEO_FIT_EXACT_COMPOSITION_V1',base:'82c433486152e61833639efeffc3bac7dbe1713e',seoSource:'36749bd7c3e728ceb09a443366a7e2b933b7c144',source:'a'.repeat(40),paths:[...SEO_FIT_COMPOSITION_PATHS]};
 validateSeoFitComposition(composition,(ref,path)=>path);
 for(const changed of composition.paths)assert.throws(()=>validateSeoFitComposition(composition,(ref,path)=>ref==='HEAD'&&path===changed?'changed':path),/source drift/);
 for(const delta of [{base:'b'.repeat(40)},{seoSource:'b'.repeat(40)},{proof:'UNBOUNDED'},{paths:[...composition.paths,'worker-entry-v6.js']}])assert.throws(()=>validateSeoFitComposition({...composition,...delta},(ref,path)=>path));
});
test('each finite SEO source path rejects unrelated source drift',()=>{
 validateSixTopicSeoSource((ref,path)=>path);
 for(const changed of SIX_TOPIC_SEO_PATHS)assert.throws(()=>validateSixTopicSeoSource((ref,path)=>ref==='HEAD'&&path===changed?'changed':path),/source drift/);
});
test('failed or wrong-source hosted proof cannot authorise promotion',async()=>{
 for(const delta of [{head_sha:'f'.repeat(40)},{path:'.github/workflows/other.yml'},{conclusion:'failure'}])await assert.rejects(verifySixTopicSeoProof(async()=>({head_sha:SIX_TOPIC_SEO_SOURCE,path:'.github/workflows/six-topic-seo-proof.yml',conclusion:'success',...delta})));
});
test('full-page preservation admits only the exact reviewed additive transform',()=>{
 const before='<html><head><title>Original</title></head><body><header>Menu</header><main><h1>Title</h1><p>Original safety text</p></main><footer>Footer</footer></body></html>';
 const after=withSixTopicGuides(before,'/mens-mental-health');
 assert.deepEqual(preserveSixTopicSeo('/mens-mental-health',Buffer.from(before)),preserveSixTopicSeo('/mens-mental-health',Buffer.from(after),{required:true}));
 assert.throws(()=>preserveSixTopicSeo('/mens-mental-health',Buffer.from(before),{required:true}),/missing/);
 assert.notDeepEqual(preserveSixTopicSeo('/mens-mental-health',Buffer.from(before)),preserveSixTopicSeo('/mens-mental-health',Buffer.from(after.replace('Original safety text','Changed safety text')),{required:true}));
 for(const path of ['/','/start-here','/member/dashboard','/treatment-centre'])assert.equal(preserveSixTopicSeo(path,Buffer.from(before)).toString(),before);
});
test('historical preservation normalises only the exact two SEO integration lines',()=>{
 const old='Preserved verification';const added="import {preserveSixTopicSeo} from '../release/six-topic-seo-preservation.mjs';\n"+old+' preserved=preserveSixTopicSeo(path,preserved,{required:Boolean(before)});\n';
 assert.equal(originalSixTopicSeoPreservation(added),old);
 assert.notEqual(originalSixTopicSeoPreservation(added.replace('required:Boolean(before)','required:false')),old);
 assert.throws(()=>originalSixTopicSeoPreservation(added+added),/Duplicate/);
});
