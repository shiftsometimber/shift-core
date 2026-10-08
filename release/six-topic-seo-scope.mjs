import {reconciliationHistoricalRef} from './approved-runtime-composition.mjs';
import {followHistoricalRead,followPinnedRef} from './seo-follow-through-scope.mjs';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
// Matt's 5 October Go covers only this finite informational SEO payload.
// Editorial authority is not clinical approval; original medical copy is preserved.
export const SIX_TOPIC_SEO_SOURCE='7a121c5e86fc889168288d42952fb20d5dbb46fa';
// The verifier itself was repaired after the original six-topic approval so it
// can recognise the exact already-live topic block. Pin that composed source
// separately: it changes proof mechanics, not the approved medical copy.
export const SIX_TOPIC_SEO_COMPOSED_SOURCE='46bdabe82077fe471bd5157ef1ba46e31a0f8829';
export const SIX_TOPIC_SEO_PATHS=['public-seo-closeout.mjs','tests/public-seo-closeout.test.mjs','scripts/verify-six-topic-seo.mjs','docs/seo/2026-10-05-six-priorities.md','.github/workflows/six-topic-seo-proof.yml'];
export const PRACTICAL_GUIDES_SOURCE='e0b046c878e46d73ea8500e3dde78bf7d4c141fa';
export const PRACTICAL_GUIDES_PATHS=['.github/workflows/practical-guides-proof.yml','docs/seo/2026-10-06-practical-guides.md','public-practical-guides.mjs','public-seo-closeout.mjs','scripts/verify-practical-guides-handler.mjs','scripts/verify-practical-guides.mjs','tests/practical-guides.test.mjs'];
export function validateSixTopicSeoSource(read,composedSource=SIX_TOPIC_SEO_SOURCE){
 for(const path of SIX_TOPIC_SEO_PATHS){const source=path==='public-seo-closeout.mjs'?PRACTICAL_GUIDES_SOURCE:path==='scripts/verify-six-topic-seo.mjs'?composedSource:SIX_TOPIC_SEO_SOURCE;assert.equal(read('HEAD',path),read(source,path),'Six-topic SEO source drift: '+path);}
 for(const path of PRACTICAL_GUIDES_PATHS)assert.equal(read('HEAD',path),read(PRACTICAL_GUIDES_SOURCE,path),'Practical-guides source drift: '+path);
}
export async function verifySixTopicSeoProof(get,composedSource=SIX_TOPIC_SEO_COMPOSED_SOURCE){
 const proof=await get('/actions/runs/37363778701');
 assert.equal(proof.head_sha,SIX_TOPIC_SEO_SOURCE);assert.equal(proof.path,'.github/workflows/six-topic-seo-proof.yml');assert.equal(proof.conclusion,'success');
 execFileSync('git',['merge-base','--is-ancestor',SIX_TOPIC_SEO_SOURCE,'HEAD']);
 const read=(ref,path)=>execFileSync('git',['rev-parse',reconciliationHistoricalRef(ref,path)+':'+path],{encoding:'utf8'}).trim();
 const follow=JSON.parse(readFileSync('shift-coach/release-manifest.json','utf8')).seoFollowThroughComposition;
 if(follow)for(const path of [...SIX_TOPIC_SEO_PATHS,...PRACTICAL_GUIDES_PATHS]){const pin=followPinnedRef(follow,path);if(pin)assert.equal(read('HEAD',path),read(pin,path),'Exact composed SEO verifier drift: '+path);}
 if(follow?.tabletGuidanceComposition){const t=follow.tabletGuidanceComposition;assert(t.run&&t.proofSource,'Hosted tablet guidance proof required');const run=await get('/actions/runs/'+t.run);assert.equal(run.head_sha,t.proofSource);assert.equal(run.path,'.github/workflows/practical-guides-proof.yml');assert.equal(run.conclusion,'success');}
 validateSixTopicSeoSource(followHistoricalRead(read,follow),composedSource);
 return {run:proof.id,source:proof.head_sha,rankingImprovementClaimed:false,clinicalApproval:false};
}
