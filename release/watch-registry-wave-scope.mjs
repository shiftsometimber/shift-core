import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
// Exact standing-authorised factual research update merged in PR #955.
// Research listings do not establish supply, sale, clinical approval or UK access.
export const WATCH_REGISTRY_WAVE_COMMIT='46d2347af6a5de84d7d5dcf05dc21b22e4122905';
export const WATCH_REGISTRY_WAVE_PATHS=['medicines-watch/README.md','medicines-watch/discovery.mjs','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-02-authorised-expanded-registry-wave.json','medicines-watch/reviews/2026-10-02-authorised-semaglutide-specialist-trials.json'];
export function validateWatchRegistryWave(read){for(const path of WATCH_REGISTRY_WAVE_PATHS)assert.equal(read('HEAD',path),read(WATCH_REGISTRY_WAVE_COMMIT,path),'Watch registry-wave source drift: '+path);}
export async function verifyWatchRegistryWaveProof(get){const proof=await get('/actions/runs/37026836341');assert.equal(proof.head_sha,WATCH_REGISTRY_WAVE_COMMIT);assert.equal(proof.path,'.github/workflows/medicines-watch-check.yml');assert.equal(proof.conclusion,'success');validateWatchRegistryWave((ref,path)=>execFileSync('git',['rev-parse',ref+':'+path],{encoding:'utf8'}).trim());return proof;}
