import test from 'node:test';
import assert from 'node:assert/strict';
import {preserveSeo794,expectedSeo794ArticleBody} from '../release/seo794-preservation.mjs';
import {repairSeoPresentation} from '../public-seo-presentation.mjs';
import {stabilisePublicHtml} from '../public-startup-stability.mjs';
import {preserveApprovedStartup} from '../release/member-details-preservation.mjs';
const raw='<html><head></head><body><header><img src="/assets/7B503EDB-D4E0-4F92-B45D-1D5A50AE2597.png" alt="SHIFT"></header><main><h1>Existing page</h1><p>Keep this whole paragraph.</p><a href="/good-to-talk">Good to Talk</a></main></body></html>';
test('live article expectation allows only the exact reviewed direct support link',()=>{
 const source='<main><p>Keep this.</p><a href="/good-to-talk">SHIFT: Good to Talk</a></main>',expected='<main><p>Keep this.</p><a href="/mens-mental-health">SHIFT: Good to Talk</a></main>';
 assert.equal(expectedSeo794ArticleBody(source,'/mental-health/mental-health-and-weight'),expected);
 assert.equal(expectedSeo794ArticleBody(source,'/unrelated'),source);
 assert.notEqual(expectedSeo794ArticleBody(source,'/mental-health/mental-health-and-weight'),expected.replace('Keep this.','Lost copy'));
 assert.throws(()=>expectedSeo794ArticleBody(source.replace('SHIFT: Good to Talk','Other label'),'/mental-health/mental-health-and-weight'),/exactly/);
});
test('approved images and styles compare equal while unrelated content remains protected',()=>{
 const candidate=repairSeoPresentation(raw.replace('href="/good-to-talk"','href="/mens-mental-health"'),'/');
 assert.deepEqual(preserveSeo794('/',Buffer.from(raw)),preserveSeo794('/',Buffer.from(candidate),{required:true}));
 for(const changed of [candidate.replace('Keep this whole paragraph.','Lost copy'),candidate.replace('alt="SHIFT"','alt="wrong"'),candidate.replace('<h1>Existing page</h1>','<h1>Other</h1>'),candidate.replace('href="/mens-mental-health"','href="/unrelated"')])assert.notDeepEqual(preserveSeo794('/',Buffer.from(raw)),preserveSeo794('/',Buffer.from(changed),{required:true}));
});
test('post-release missing or altered approved presentation fails closed',()=>{
 assert.throws(()=>preserveSeo794('/',Buffer.from(raw),{required:true}),/contrast/);
 const candidate=repairSeoPresentation(raw,'/');assert.throws(()=>preserveSeo794('/',Buffer.from(candidate.replace('transition:none!important','transition:all!important')),{required:true}),/contrast/);
});
test('member and non-document assets are left byte-for-byte unchanged',()=>{
 const input=Buffer.from(raw);assert.deepEqual(preserveSeo794('/member-login',input,{required:true}),input);
 const script=Buffer.from('const account="private";');assert.deepEqual(preserveSeo794('/asset.js',script,{required:true}),script);
});
test('exact startup restoration precedes SEO normalisation for actual production wrapper order',()=>{
 const source='<html><head></head><body data-template="shift-programme"><main id="main-content" class="programme-five-beat"><p>One practical journey for losing weight, living better while doing it and protecting what you gain.</p></main></body></html>';
 const before=stabilisePublicHtml('/programme',source),after=stabilisePublicHtml('/programme',repairSeoPresentation(source,'/programme'));
 const normalise=(html,required)=>preserveSeo794('/programme',preserveApprovedStartup('/programme',Buffer.from(html)),{required});
 assert.deepEqual(normalise(before,false),normalise(after,true));
 assert.throws(()=>preserveApprovedStartup('/programme',preserveSeo794('/programme',Buffer.from(before))),/Unknown startup transformation/);
 assert.throws(()=>normalise(after.replace('Turn useful information','Unapproved change'),true),/Unexpected startup preservation signature/);
});
