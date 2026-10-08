import assert from 'node:assert/strict';
import {immutableHistoryExecFileSync as execFileSync,verifyReconciledRelease,reconciliationGitArgs} from './approved-runtime-composition.mjs';
export const TREATMENT_GUIDANCE_PREVIEW='a00358e366274e8f333eb09a87b9a8ca3d7764e9';
export const TREATMENT_GUIDANCE_RUN=37016591664;
export const TREATMENT_GUIDANCE_PATHS=["medicine-commerce-v1.js","public-treatment-guidance.mjs","public-promise-accuracy-v1.mjs","public-promise-preservation.mjs","frontend/medicine-front-door/product.html","frontend/medicine-front-door/medicine-front-door.js","frontend/medicine-front-door/treatment-assessment.html","frontend/member/treatment-assessment.html","tests/medicine-purchase-e2e.test.mjs","tests/public-treatment-guidance.test.mjs","tests/promise-accuracy.test.mjs","frontend/medicine-front-door/mounjaro.html","frontend/medicine-front-door/wegovy-injection.html","frontend/medicine-front-door/wegovy-tablet.html","frontend/medicine-front-door/orlistat.html","frontend/medicine-front-door/foundayo.html"];
// Exact server-only adult intake repair authorised by Matt's 3 October consolidation.
export const ADULT_INTAKE_SOURCE='189e818f80a12cdcfc2294bb2d9839ffb6a04a5f';
export const ADULT_INTAKE_PATHS=new Set(['medicine-commerce-v1.js','tests/medicine-purchase-e2e.test.mjs']);
export function treatmentGuidanceRef(path){return ADULT_INTAKE_PATHS.has(path)?ADULT_INTAKE_SOURCE:TREATMENT_GUIDANCE_PREVIEW;}
export function validateTreatmentGuidance(read){for(const path of TREATMENT_GUIDANCE_PATHS)assert.equal(read('HEAD',path),read(treatmentGuidanceRef(path),path),'Treatment service criteria/source drift: '+path);}
export async function verifyTreatmentGuidanceProof(get){const proof=await get('/actions/runs/'+TREATMENT_GUIDANCE_RUN);assert.equal(proof.head_sha,TREATMENT_GUIDANCE_PREVIEW);assert.equal(proof.path,'.github/workflows/treatment-guidance-preview.yml');assert.equal(proof.conclusion,'success','Service exclusions and phone/desktop information preview must pass');verifyReconciledRelease();validateTreatmentGuidance((ref,path)=>execFileSync('git',reconciliationGitArgs(['rev-parse',ref+':'+path]),{encoding:'utf8'}).trim());return proof;}
