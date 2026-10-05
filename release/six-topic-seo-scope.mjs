import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
// Matt's 5 October Go covers only this finite informational SEO payload.
// Editorial authority is not clinical approval; original medical copy is preserved.
export const SIX_TOPIC_SEO_SOURCE='7a121c5e86fc889168288d42952fb20d5dbb46fa';
export const SIX_TOPIC_SEO_PATHS=['public-seo-closeout.mjs','tests/public-seo-closeout.test.mjs','scripts/verify-six-topic-seo.mjs','docs/seo/2026-10-05-six-priorities.md','.github/workflows/six-topic-seo-proof.yml'];
export function validateSixTopicSeoSource(read){for(const path of SIX_TOPIC_SEO_PATHS)assert.equal(read('HEAD',path),read(SIX_TOPIC_SEO_SOURCE,path),'Six-topic SEO source drift: '+path);}
export async function verifySixTopicSeoProof(get){
 const proof=await get('/actions/runs/37363778701');
 assert.equal(proof.head_sha,SIX_TOPIC_SEO_SOURCE);assert.equal(proof.path,'.github/workflows/six-topic-seo-proof.yml');assert.equal(proof.conclusion,'success');
 execFileSync('git',['merge-base','--is-ancestor',SIX_TOPIC_SEO_SOURCE,'HEAD']);
 validateSixTopicSeoSource((ref,path)=>execFileSync('git',['rev-parse',ref+':'+path],{encoding:'utf8'}).trim());
 return {run:proof.id,source:proof.head_sha,rankingImprovementClaimed:false,clinicalApproval:false};
}
