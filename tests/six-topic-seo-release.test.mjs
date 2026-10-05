import test from 'node:test';import assert from 'node:assert/strict';
import {SIX_TOPIC_SEO_SOURCE,SIX_TOPIC_SEO_PATHS,validateSixTopicSeoSource,verifySixTopicSeoProof} from '../release/six-topic-seo-scope.mjs';
import {preserveSixTopicSeo} from '../release/six-topic-seo-preservation.mjs';
import {withSixTopicGuides} from '../public-seo-closeout.mjs';
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
