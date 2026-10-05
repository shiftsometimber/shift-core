import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
// Exact standing-authorised factual research updates through PR #1115, including
// the oral ASC36 Phase I programme; prior reviewed claims are preserved.
// Research listings do not establish supply, sale, clinical approval or UK access.
export const WATCH_REGISTRY_WAVE_COMMIT='12cb006acd9e309cbd341cc49492b59adffd3eb7';
export const WATCH_REGISTRY_WAVE_PATHS=['medicines-watch/evidence-desk.mjs','medicines-watch/evidence-desk.test.mjs','medicines-watch/reviews/2026-10-03-evidence-desk-zp6590.json','medicines-watch/README.md','medicines-watch/data.mjs','medicines-watch/discovery.mjs','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/product-renewal.test.mjs','medicines-watch/provider-review.test.mjs','medicines-watch/source-review.test.mjs','medicines-watch/reviews/2026-10-02-authorised-expanded-registry-wave.json','medicines-watch/reviews/2026-10-02-authorised-semaglutide-specialist-trials.json','medicines-watch/reviews/2026-10-02-authorised-glimr-copd.json','medicines-watch/reviews/2026-10-02-authorised-specialist-registry-followup.json','medicines-watch/reviews/2026-10-02-authorised-switching-studies.json','medicines-watch/reviews/2026-10-02-authorised-na931.json','medicines-watch/reviews/2026-10-03-authorised-amylin-metabolic-followup.json','medicines-watch/reviews/2026-10-03-authorised-azd1043.json','medicines-watch/reviews/2026-10-03-authorised-azd6234-selene.json','medicines-watch/reviews/2026-10-03-authorised-wve007.json','medicines-watch/reviews/2026-10-03-authorised-specialist-registry-wave.json','medicines-watch/reviews/2026-10-03-authorised-lean-mass-energy-followup.json','medicines-watch/reviews/2026-10-03-authorised-foundayo-predicted-risk.json','medicines-watch/reviews/2026-10-03-authorised-wegovy-mash-correction.json','medicines-watch/reviews/2026-10-03-authorised-vk3019-at673.json','medicines-watch/reviews/2026-10-04-authorised-srsd384.json','medicines-watch/reviews/2026-10-04-authorised-fractyl-modality-gap.json','medicines-watch/reviews/2026-10-04-authorised-art2713-muscle-gap.json','medicines-watch/reviews/2026-10-04-authorised-rgt075.json','medicines-watch/reviews/2026-10-04-authorised-vct220.json','medicines-watch/reviews/2026-10-04-authorised-vk2735-maintenance.json','medicines-watch/reviews/2026-10-04-wegovy-tablet-provider-renewal.json','medicines-watch/reviews/2026-10-04-authorised-survodutide-paper.json','medicines-watch/reviews/2026-10-04-authorised-azelaprag-discontinuation.json','medicines-watch/reviews/2026-10-04-authorised-taldefgrobep-rv8451.json','medicines-watch/reviews/2026-10-04-authorised-foundayo-attain-maintain.json','medicines-watch/industry-page.mjs','medicines-watch/monitor.mjs','medicines-watch/page.mjs','medicines-watch/verify-live.mjs','medicines-watch/credibility.mjs','medicines-watch/credibility.test.mjs','medicines-watch/registry-lifecycle.mjs','medicines-watch/reviews/2026-10-03-credibility-improvements.json'];
WATCH_REGISTRY_WAVE_PATHS.push('medicines-watch/reviews/2026-10-04-authorised-international-maintenance-wave.json');
WATCH_REGISTRY_WAVE_PATHS.push('medicines-watch/reviews/2026-10-05-authorised-novo-specialist-wave.json');
WATCH_REGISTRY_WAVE_PATHS.push('medicines-watch/reviews/2026-10-05-authorised-hansoh-olatorepatide-source-review.json');
WATCH_REGISTRY_WAVE_PATHS.push('medicines-watch/reviews/2026-10-05-authorised-petrelintide-zupreme-registry.json');
WATCH_REGISTRY_WAVE_PATHS.push('medicines-watch/reviews/2026-10-05-authorised-ribupatide-specialist-wave.json');
WATCH_REGISTRY_WAVE_PATHS.push('medicines-watch/reviews/2026-10-05-authorised-gzc8072.json');
WATCH_REGISTRY_WAVE_PATHS.push('medicines-watch/reviews/2026-10-05-authorised-asc30-aurora-phase3.json');
WATCH_REGISTRY_WAVE_PATHS.push('medicines-watch/reviews/2026-10-05-authorised-ard201-pause.json');
WATCH_REGISTRY_WAVE_PATHS.push('medicines-watch/reviews/2026-10-05-authorised-asc36-oral.json');
WATCH_REGISTRY_WAVE_PATHS.push('medicines-watch/reviews/2026-10-05-authorised-te8105-phase2b.json');
// The ASC36 review keeps the sponsor-reported study initiation, planned 86-participant design, absent registry record, animal findings and UK access separate without clearing unrelated source failures.
export const WATCH_SOURCE_LINK_SOURCE=WATCH_REGISTRY_WAVE_COMMIT;
export const WATCH_OWNERSHIP_SOURCE='1eca49505836ac99e5b1cb929660f1e108213781';
export const WATCH_OWNERSHIP_BASE='725e4bb0d27d4cbd52e85c27bfa9e27841a166b0';
export const WATCH_OWNERSHIP_PATHS=['worker-entry-v6.js','medicines-watch/monitor.mjs','medicines-watch/monitor.test.mjs','medicines-watch/scheduler.test.mjs'];
for(const path of WATCH_OWNERSHIP_PATHS)if(!WATCH_REGISTRY_WAVE_PATHS.includes(path))WATCH_REGISTRY_WAVE_PATHS.push(path);
// Exact 4 October timeout repair: all scheduler ownership and other source bytes remain pinned.
export const WATCH_DEADLINE_SOURCE='817cfc1a1957e0bd23fd2bfb6b6d2ed95bb0d976';
export const WATCH_DEADLINE_PATHS=['medicines-watch/monitor.mjs','medicines-watch/monitor.test.mjs'];
export const watchWaveRef=path=>WATCH_DEADLINE_PATHS.includes(path)?WATCH_DEADLINE_SOURCE:WATCH_OWNERSHIP_PATHS.includes(path)?WATCH_OWNERSHIP_SOURCE:WATCH_REGISTRY_WAVE_COMMIT;
export function originalWatchOwnershipEntry(source){
 const change='      // Production promotion seeds reviewed URL replacements before the new\n      // runtime is exposed.  An invocation already in flight on the previous\n      // runtime must not switch that row back to its older configuration.\n      const medicinesWatch = await checkSources(env, { allowSourceReplacement: false }).catch((error) => ({';
 if(!source.includes(change))return source;
 assert.equal(createHash('sha256').update(source).digest('hex'),'7ff2cfa13b850d1853d975dfcdec6f99b43f3c7c64d964aeb62cc50f31e8ac42','Unreviewed Watch scheduler entry');
 return source.replace(change,'      const medicinesWatch = await checkSources(env).catch((error) => ({')+'\n';
}
export function validateWatchRegistryWave(read){for(const path of WATCH_REGISTRY_WAVE_PATHS)assert.equal(read('HEAD',path),read(watchWaveRef(path),path),'Watch registry-wave source drift: '+path);}
export async function verifyWatchRegistryWaveProof(get){const proof=await get('/actions/runs/37316086081');assert.equal(proof.head_sha,'da1cbfec19917aac98c4e83f832902d790e9ca41');assert.equal(proof.path,'.github/workflows/medicines-watch-check.yml');assert.equal(proof.conclusion,'success');validateWatchRegistryWave((ref,path)=>execFileSync('git',['rev-parse',ref+':'+path],{encoding:'utf8'}).trim());return proof;}
