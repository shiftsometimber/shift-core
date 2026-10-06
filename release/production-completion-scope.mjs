import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
export const COMPLETION_BASE='c495db14e1f9d5f34bd5f051da36bedfae29f9a9';
export const COMPLETION_PAYLOAD='875009585ff3d1f0ebf97d8e3256643509739b02';
export const COMPLETION_PAYLOAD_PATHS=['.github/workflows/cloudflare-production-promote.yml','shift-coach/cancelled-release-recovery.mjs','shift-coach/cancelled-release-recovery.test.mjs','shift-coach/recover-cancelled-release.mjs'];
export const COMPLETION_MAINTENANCE_PATHS=['.github/workflows/production-completion-proof.yml','release/production-completion-scope.mjs','release/seo-technical-scope.mjs','tests/production-completion-release.test.mjs','docs/runtime-cancelled-37512509413.json'];
export const COMPLETION_PATHS=[...COMPLETION_PAYLOAD_PATHS,...COMPLETION_MAINTENANCE_PATHS];
export function validateCompletionComposition(c){
 assert(c,'Exact production-completion composition required');
 assert.equal(c.proof,'EXACT_CANCELLED_SEO_RUNTIME_RECOVERY_V1');
 assert.equal(c.base,COMPLETION_BASE);assert.equal(c.payloadSource,COMPLETION_PAYLOAD);
 assert.deepEqual(c.payloadPaths,COMPLETION_PAYLOAD_PATHS);assert.deepEqual(c.maintenancePaths,COMPLETION_MAINTENANCE_PATHS);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);
 assert.deepEqual(c.request,{instruction:"let's get this properly working - and growing its organic reach. We also need to ensure our website authority grows in the correct way.",date:'2026-10-06',scope:'Exact cancelled SEO runtime recovery to its successful captured predecessor; complete original release checks; no customer-data rollback or public-wording change.'});
 return c;
}
export function completionPinnedRef(c,path){if(!c)return null;validateCompletionComposition(c);return COMPLETION_PAYLOAD_PATHS.includes(path)?c.payloadSource:COMPLETION_MAINTENANCE_PATHS.includes(path)?c.maintenanceSource:null;}
export function verifyCompletionHistory(c){
 if(!c)return;validateCompletionComposition(c);const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
 for(const ref of [c.base,c.payloadSource,c.maintenanceSource])git('merge-base','--is-ancestor',ref,'HEAD');
 assert.deepEqual(git('diff','--name-only',c.base,c.payloadSource).split('\n').filter(Boolean).sort(),[...COMPLETION_PAYLOAD_PATHS].sort());
 assert.deepEqual(git('diff','--name-only',c.payloadSource,c.maintenanceSource).split('\n').filter(Boolean).sort(),[...COMPLETION_MAINTENANCE_PATHS,'shift-coach/release-manifest.json'].sort());
 assert.equal(execFileSync('git',['show',c.payloadSource+':.github/workflows/cloudflare-production-promote.yml'],{encoding:'utf8'}),execFileSync('git',['show',c.base+':.github/workflows/cloudflare-production-promote.yml'],{encoding:'utf8'}).replace('    timeout-minutes: 15','    timeout-minutes: 25'),'All production steps and rollback conditions remain unchanged');
}
