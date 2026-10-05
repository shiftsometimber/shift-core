import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {FIT_EXPANSION_SERVING_AUTHORITY} from '../fit-expansion-serving-manifest-v1.mjs';
import {validateSixTopicSeoSource} from './six-topic-seo-scope.mjs';

export const SEO_FIT_COMPOSITION_PATHS=['scripts/b1-release-scope.mjs','release/app-scope.mjs','shift-coach/release-contract.mjs','release/fit-300-scope.mjs','release/app-manifest.json','tests/six-topic-seo-release.test.mjs'];
const SEO_COMPOSED_PATHS=new Set(['.github/workflows/cloudflare-production-promote.yml','.github/workflows/six-topic-seo-proof.yml','docs/seo/2026-10-05-six-priorities.md','member-experience/public-preservation.mjs','public-seo-closeout.mjs','release/app-manifest.json','release/app-preflight.mjs','release/book-voice-scope.mjs','release/six-topic-seo-preservation.mjs','release/six-topic-seo-scope.mjs','scripts/b1-release-scope.mjs','scripts/verify-six-topic-seo.mjs','shift-coach/release-contract.mjs','shift-coach/release-manifest.json','tests/public-seo-closeout.test.mjs','tests/six-topic-seo-release.test.mjs']);
export function validateSeoFitComposition(composition,read){
 assert.equal(composition.proof,'SEO_FIT_EXACT_COMPOSITION_V1');
 assert.equal(composition.base,'82c433486152e61833639efeffc3bac7dbe1713e');
 assert.equal(composition.seoSource,'36749bd7c3e728ceb09a443366a7e2b933b7c144');
 assert.match(composition.source,/^[a-f0-9]{40}$/);
 assert.deepEqual(composition.paths,SEO_FIT_COMPOSITION_PATHS);
 for(const path of composition.paths)assert.equal(read('HEAD',path),read(composition.source,path),'SEO/Fit composition source drift: '+path);
}

// Exact runtime activation. No new prescriptions, catalogue writes or inferred
// trainer/clinical approval. Existing safety/equipment/dose checks remain intact.
export const IMAGE_VIEWER_PATHS=new Set(['shift-coach/member-image-viewer.mjs','tests/member-image-viewer.test.mjs','shift-coach/fit-active-edit.mjs','shift-coach/fit-active-edit.test.mjs','shift-coach/release-contract.mjs','release/fit-300-scope.mjs']);
export const FIT300_PATHS=new Set([...IMAGE_VIEWER_PATHS,'fit-expansion-serving-manifest-v1.mjs','release/fit-300-scope.mjs','release/fit-300-activation.json','tests/fit-expansion-publication.test.mjs','scripts/b1-release-scope.mjs','release/app-scope.mjs','shift-coach/release-contract.mjs','shift-coach/release-manifest.json']);
export const READONLY_ORGANIC_PATHS=new Set(['.github/workflows/organic-growth-content.yml','editorial/organic-growth-20261005/README.md','editorial/organic-growth-20261005/baseline.json','editorial/organic-growth-20261005/intent-map.json','editorial/organic-growth-20261005/nhs-weight-loss-drugs.json','editorial/organic-growth-20261005/publication.test.mjs','editorial/organic-growth-20261005/publish.mjs','editorial/organic-growth-20261005/release-receipt.json','editorial/organic-growth-20261005/wegovy-side-effects-timeline.json']);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const sha=b=>createHash('sha256').update(b).digest('hex');

export function validateFit300(){
 assert(existsSync('release/fit-300-activation.json'),'Exact Fit activation receipt required');
 const activation=JSON.parse(readFileSync('release/fit-300-activation.json'));
 const coach=JSON.parse(readFileSync('shift-coach/release-manifest.json'));
 const composition=coach.seoFitComposition;
 if(composition){
  validateSeoFitComposition(composition,(ref,path)=>git('rev-parse',ref+':'+path));
  git('merge-base','--is-ancestor',composition.base,composition.source);git('merge-base','--is-ancestor',composition.source,'HEAD');
  git('merge-base','--is-ancestor',composition.seoSource,composition.source);
  validateSixTopicSeoSource((ref,path)=>git('rev-parse',ref+':'+path));
 }
 assert.equal(activation.proof,'FIT_300_RUNTIME_ACTIVATION_V1');
 assert.equal(activation.base,'eecd31ba0f3eb06e8de829d3415d7f86e954a162');
 assert.match(activation.source,/^[a-f0-9]{40}$/);
 assert.equal(activation.ownerInstruction.quote,'Can’t we get the full 300');
 assert.equal(activation.ownerInstruction.actor,'Matt');
 assert.equal(activation.trainerAttestation,false);assert.equal(activation.clinicalAttestation,false);
 assert.equal(activation.databaseWrites,false);
 git('merge-base','--is-ancestor',activation.base,activation.source);git('merge-base','--is-ancestor',activation.source,'HEAD');
 const viewer=activation.imageViewerComposition;
 assert.equal(viewer?.proof,'MEMBER_IMAGE_VIEWER_RELEASE_V1');
 assert.equal(viewer.base,'4afdd2686d5a74dfeea9ca2d86aba71e62ed2320');
 assert.match(viewer.source,/^[a-f0-9]{40}$/);
 assert.equal(viewer.ownerInstruction.actor,'Matt');
 assert.equal(viewer.ownerInstruction.quote,'No good these pics on a mobile ….. it doesn’t let you click on them to enlarge ? So can’t view what it is ? Assume perhaps same for grub');
 git('merge-base','--is-ancestor',viewer.base,viewer.source);git('merge-base','--is-ancestor',viewer.source,'HEAD');
 const viewerChanges=git('diff','--name-only',viewer.base,'HEAD').split('\n').filter(Boolean);
 assert(viewerChanges.every(p=>IMAGE_VIEWER_PATHS.has(p)||(composition&&SEO_COMPOSED_PATHS.has(p))||['release/fit-300-activation.json','shift-coach/release-manifest.json'].includes(p)),'Unrelated image viewer release change');
 for(const p of IMAGE_VIEWER_PATHS)assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',(composition?.paths.includes(p)?composition.source:viewer.source)+':'+p),'Image viewer source drift: '+p);
 const allowed=git('diff','--name-only',activation.base,'HEAD').split('\n').filter(Boolean);
 assert(allowed.every(p=>FIT300_PATHS.has(p)||(composition&&SEO_COMPOSED_PATHS.has(p))),'Unrelated change in Fit activation');
 for(const p of FIT300_PATHS)if(!['release/fit-300-activation.json','shift-coach/release-manifest.json'].includes(p)){
  const ref=composition?.paths.includes(p)?composition.source:IMAGE_VIEWER_PATHS.has(p)?viewer.source:activation.source;
  assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',ref+':'+p),'Fit payload source drift: '+p);
 }
 for(const p of READONLY_ORGANIC_PATHS)assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',activation.base+':'+p),'Organic baseline source drift: '+p);
 const wire=JSON.parse(gunzipSync(readFileSync('evidence/fit-publication-2026-09-16/owner-release.json.gz')));
 assert.deepEqual(FIT_EXPANSION_SERVING_AUTHORITY,wire.manifest,'Only exact existing owner release may be activated');
 assert.equal(wire.manifest.canonical_movements,300);assert.equal(wire.manifest.served_count,2688);
 const art=JSON.parse(readFileSync('preview/fit-grub/v3/approval.json'));
 assert.equal(art.records.length,300);assert.equal(art.heldImages,0);
 for(const r of art.records){assert.equal(r.status,'approved');assert.equal(sha(readFileSync('frontend/member'+r.image)),r.sha256,'Approved artwork drift: '+r.id);}
 assert.deepEqual(coach.fitComposition,{proof:'FIT_300_BOUNDED_RELEASE_COMPOSITION_V1',source:activation.source,paths:['scripts/b1-release-scope.mjs','release/app-scope.mjs','shift-coach/release-contract.mjs']});
 const priorCoach=JSON.parse(execFileSync('git',['show',(composition?composition.seoSource:activation.base)+':shift-coach/release-manifest.json'],{encoding:'utf8'}));
 assert.deepEqual(coach.imageViewerComposition,{proof:'MEMBER_IMAGE_VIEWER_RELEASE_V1',source:viewer.source,paths:['shift-coach/fit-active-edit.mjs','shift-coach/fit-active-edit.test.mjs','shift-coach/release-contract.mjs']});
 const {fitComposition,seoFitComposition,imageViewerComposition,...unchanged}=coach;assert.deepEqual(unchanged,priorCoach,'Existing coaching launch decisions changed');
 return {movements:300,servedProtocols:2688,approvedImages:300,databaseWrites:false,existingLayoutPreserved:true,tapToEnlarge:true};
}
