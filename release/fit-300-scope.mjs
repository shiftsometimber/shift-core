import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {FIT_EXPANSION_SERVING_AUTHORITY} from '../fit-expansion-serving-manifest-v1.mjs';

// Exact runtime activation. No new prescriptions, catalogue writes or inferred
// trainer/clinical approval. Existing safety/equipment/dose checks remain intact.
export const FIT300_PATHS=new Set(['fit-expansion-serving-manifest-v1.mjs','release/fit-300-scope.mjs','release/fit-300-activation.json','tests/fit-expansion-publication.test.mjs','scripts/b1-release-scope.mjs','release/app-scope.mjs','shift-coach/release-contract.mjs','shift-coach/release-manifest.json']);
export const READONLY_ORGANIC_PATHS=new Set(['.github/workflows/organic-growth-content.yml','editorial/organic-growth-20261005/README.md','editorial/organic-growth-20261005/baseline.json','editorial/organic-growth-20261005/intent-map.json','editorial/organic-growth-20261005/nhs-weight-loss-drugs.json','editorial/organic-growth-20261005/publication.test.mjs','editorial/organic-growth-20261005/publish.mjs','editorial/organic-growth-20261005/release-receipt.json','editorial/organic-growth-20261005/wegovy-side-effects-timeline.json']);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const sha=b=>createHash('sha256').update(b).digest('hex');

export function validateFit300(){
 assert(existsSync('release/fit-300-activation.json'),'Exact Fit activation receipt required');
 const activation=JSON.parse(readFileSync('release/fit-300-activation.json'));
 assert.equal(activation.proof,'FIT_300_RUNTIME_ACTIVATION_V1');
 assert.equal(activation.base,'eecd31ba0f3eb06e8de829d3415d7f86e954a162');
 assert.match(activation.source,/^[a-f0-9]{40}$/);
 assert.equal(activation.ownerInstruction.quote,'Can’t we get the full 300');
 assert.equal(activation.ownerInstruction.actor,'Matt');
 assert.equal(activation.trainerAttestation,false);assert.equal(activation.clinicalAttestation,false);
 assert.equal(activation.databaseWrites,false);
 git('merge-base','--is-ancestor',activation.base,activation.source);git('merge-base','--is-ancestor',activation.source,'HEAD');
 const allowed=git('diff','--name-only',activation.base,'HEAD').split('\n').filter(Boolean);
 assert(allowed.every(p=>FIT300_PATHS.has(p)),'Unrelated change in Fit activation');
 for(const p of FIT300_PATHS)if(!['release/fit-300-activation.json','shift-coach/release-manifest.json'].includes(p))assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',activation.source+':'+p),'Fit payload source drift: '+p);
 for(const p of READONLY_ORGANIC_PATHS)assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',activation.base+':'+p),'Organic baseline source drift: '+p);
 const wire=JSON.parse(gunzipSync(readFileSync('evidence/fit-publication-2026-09-16/owner-release.json.gz')));
 assert.deepEqual(FIT_EXPANSION_SERVING_AUTHORITY,wire.manifest,'Only exact existing owner release may be activated');
 assert.equal(wire.manifest.canonical_movements,300);assert.equal(wire.manifest.served_count,2688);
 const art=JSON.parse(readFileSync('preview/fit-grub/v3/approval.json'));
 assert.equal(art.records.length,300);assert.equal(art.heldImages,0);
 for(const r of art.records){assert.equal(r.status,'approved');assert.equal(sha(readFileSync('frontend/member'+r.image)),r.sha256,'Approved artwork drift: '+r.id);}
 const coach=JSON.parse(readFileSync('shift-coach/release-manifest.json'));
 assert.deepEqual(coach.fitComposition,{proof:'FIT_300_BOUNDED_RELEASE_COMPOSITION_V1',source:activation.source,paths:['scripts/b1-release-scope.mjs','release/app-scope.mjs','shift-coach/release-contract.mjs']});
 const priorCoach=JSON.parse(execFileSync('git',['show',activation.base+':shift-coach/release-manifest.json'],{encoding:'utf8'}));
 const {fitComposition,...unchanged}=coach;assert.deepEqual(unchanged,priorCoach,'Existing coaching launch decisions changed');
 return {movements:300,servedProtocols:2688,approvedImages:300,databaseWrites:false,designUnchanged:true};
}
