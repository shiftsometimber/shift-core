import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

// Exact selected-week workflow bytes, prepared for the later A021 admission.
// This source is not an accepted-main or production receipt.
export const GP_CI_SELECTED_WEEK_SOURCE='f82bdb66a54d4b2778f4df737648b127cc1f748d';
export const GP_CI_SELECTED_WEEK_TREE='d142e861721131bb384215beb92b6104ce769a82';
export const GP_CI_BOOTSTRAP_STEP='      - name: Prepare exact original GP core source objects without changing references\n        run: node release/prepare-gp-source-objects-20261014.mjs --core "$PWD"\n';
const workflow=(job,blob,anchor)=>Object.freeze({job,blob,anchor});
export const GP_CI_BOOTSTRAP_WORKFLOWS=Object.freeze({
 '.github/workflows/cloudflare-production-promote.yml':workflow('promote','cd8c81a8d8c29def3c25b93112a4c56456b5cbfc','      - name: Require recorded coaching launch decisions before production work\n'),
 '.github/workflows/shift-coach-integration.yml':workflow('integration','c7b65fd4cdbd0cb9359179f1cb72c8e0f902eecb','      - name: Verify one frozen finite source and every retained bound\n'),
 '.github/workflows/readiness-preservation.yml':workflow('preservation','70da55678022ae8534cf1283b298259c76c5658c','      - name: Verify connected journeys, treatment records and preservation\n'),
 '.github/workflows/health-passport-preview.yml':workflow('preview','e173d364d60b2346598afedb3ef5dc2a06889e3c','      - name: Real SQLite, authentication, consent and preservation regressions\n'),
 '.github/workflows/programme-day-preview.yml':workflow('preview','d8c4329cef041485912aa4caaea6d3d2ca6e72b7','      - run: node --test tests/programme-day*.mjs tests/growth-release.test.mjs tests/approved-runtime-composition.test.mjs tests/public-tool-release.test.mjs obesity-awareness/measurement-navigation.test.mjs obesity-awareness/production.test.mjs tests/male-obesity-arrival-composition.test.mjs\n'),
 '.github/workflows/tablet-wording-release-proof.yml':workflow('exact-composition','ed40351ab38a901f683ef51f43bd5ca90dd8fbd8','      - run: node --test tests/tablet-wording.test.mjs tests/tablet-wording-release.test.mjs tests/promise-accuracy.test.mjs tests/public-treatment-guidance.test.mjs\n'),
 '.github/workflows/production-completion-proof.yml':workflow('proof','ca1caefc5c7d323c266572c96feff327bf6a2bc1','      - run: node --test shift-coach/cancelled-release-recovery.test.mjs tests/production-completion-release.test.mjs\n')
});
export const GP_CI_BOOTSTRAP_PATHS=Object.freeze(Object.keys(GP_CI_BOOTSTRAP_WORKFLOWS));
export function gpCiGitBlob(value){const bytes=Buffer.from(value);return createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');}
export function assertGpCiBaselineIdentity(path,value){const spec=GP_CI_BOOTSTRAP_WORKFLOWS[path];assert(spec,'Unapproved GP CI workflow path');assert.equal(gpCiGitBlob(value),spec.blob,'Exact selected-week workflow baseline required: '+path);return spec;}
// Pure literal operations. Native source admission separately authenticates the
// baseline Git object; it does not accept a callback as proof of that identity.
export function insertGpCiPrerequisite(path,value){
 const spec=GP_CI_BOOTSTRAP_WORKFLOWS[path];assert(spec,'Unapproved GP CI workflow path');
 assert(!value.includes(GP_CI_BOOTSTRAP_STEP),'GP source prerequisite is already present');
 assert.equal(value.split(spec.anchor).length,2,'One exact first-source step required: '+path);
 return value.replace(spec.anchor,GP_CI_BOOTSTRAP_STEP+spec.anchor);
}
export function withoutGpCiPrerequisite(path,value){
 const spec=GP_CI_BOOTSTRAP_WORKFLOWS[path];assert(spec,'Unapproved GP CI workflow path');
 assert.equal(value.split(GP_CI_BOOTSTRAP_STEP).length,2,'One exact GP source prerequisite required: '+path);
 assert.equal(value.split(GP_CI_BOOTSTRAP_STEP+spec.anchor).length,2,'GP prerequisite must precede the original first-source step: '+path);
 return value.replace(GP_CI_BOOTSTRAP_STEP,'');
}
export function verifyGpCiWorkflowText(path,current,baseline){assert.equal(withoutGpCiPrerequisite(path,current),baseline,'Every original workflow byte outside the GP source prerequisite must remain: '+path);return current;}
