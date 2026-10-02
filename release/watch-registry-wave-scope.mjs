import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
// Exact standing-authorised factual research updates through PR #987.
// Research listings do not establish supply, sale, clinical approval or UK access.
export const WATCH_REGISTRY_WAVE_COMMIT='5470bee6d9519923efc3a88dee9291b0d4c8aca9';
export const WATCH_REGISTRY_WAVE_PATHS=['medicines-watch/README.md','medicines-watch/discovery.mjs','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-02-authorised-expanded-registry-wave.json','medicines-watch/reviews/2026-10-02-authorised-semaglutide-specialist-trials.json','medicines-watch/reviews/2026-10-02-authorised-glimr-copd.json','medicines-watch/reviews/2026-10-02-authorised-specialist-registry-followup.json','medicines-watch/reviews/2026-10-02-authorised-switching-studies.json','medicines-watch/reviews/2026-10-02-authorised-na931.json'];
export function validateWatchRegistryWave(read){for(const path of WATCH_REGISTRY_WAVE_PATHS)assert.equal(read('HEAD',path),read(WATCH_REGISTRY_WAVE_COMMIT,path),'Watch registry-wave source drift: '+path);}
export async function verifyWatchRegistryWaveProof(get){const proof=await get('/actions/runs/37076326263');assert.equal(proof.head_sha,WATCH_REGISTRY_WAVE_COMMIT);assert.equal(proof.path,'.github/workflows/medicines-watch-check.yml');assert.equal(proof.conclusion,'success');validateWatchRegistryWave((ref,path)=>execFileSync('git',['rev-parse',ref+':'+path],{encoding:'utf8'}).trim());return proof;}
