import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {existsSync,readFileSync} from 'node:fs';

export const COMPOSITION_BASE='e9d8ca70c6cd969bbd02caee31deb1f8b12bb67f';
export const COMPOSITION_SOURCE='63993a0ce480a4aa5c7a1d47017c682dccc837f1';
export const SUPPORT_SOURCE='ec3b9bcc2e4909087246fc343dcaad35141de576';
export const HQ_SOURCE='5e2a6bbe7714fe098eebfa22bc7acbe9e3d2d5c2';
export const COMPOSITION_PATHS=[
'.github/workflows/hq-management-release.yml','HQ-MANAGEMENT-RELEASE.md',
'continuity-measurement/scorecard.mjs','docs/AFTER-TREATMENT-EVIDENCE-BOUNDARIES-2026-10-07.md',
'frontend/member/member-product-v33d.js','frontend/member/member-shell-v33g.js',
'frontend/member/my-timber-preview.html','frontend/member/my-timber-v11.js',
'hq-ai-v2.js','hq-management-acceptance.mjs','hq-management-api.mjs',
'hq-management-browser-acceptance.mjs','hq-management-deploy.mjs','hq-management-entry.mjs',
'hq-management-gateway-acceptance.mjs','hq-management-public-preservation.mjs','hq-management-release-gate.mjs',
'member-experience/ai-site-knowledge.mjs','member-experience/entry.mjs',
'member-experience/tests/continuity-measurement.test.mjs','member-experience/tests/shared-arrival.test.mjs',
'my-timber-navigation-gate.mjs','product-analytics-v1.js','public-continuity.mjs',
'public-promise-accuracy-v1.mjs','public-seo-discovery.mjs','shift-coach/memory.mjs','shift-coach/ui.mjs',
'tests/ai-site-knowledge.test.mjs','tests/my-timber-analytics-privacy.test.mjs',
'tests/promise-accuracy.test.mjs','tests/public-continuity.test.mjs','tests/public-seo-discovery.test.mjs',
'worker-entry-v6.js','worker.js','wrangler.hq-management.jsonc'];
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const sorted=xs=>[...xs].sort();
export function verifyComposedRuntime({head=git('rev-parse','HEAD'),read=(ref,path)=>git('rev-parse',ref+':'+path),diff=(a,b)=>git('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor=(a,b)=>git('merge-base','--is-ancestor',a,b)}={}){
 // The composition is a concrete immutable tree, not an expanded allowlist.
 assert.match(head,/^[a-f0-9]{40}$/);
 for(const ref of [COMPOSITION_BASE,SUPPORT_SOURCE,HQ_SOURCE,COMPOSITION_SOURCE])ancestor(ref,head);
 assert.deepEqual(sorted(diff(COMPOSITION_BASE,COMPOSITION_SOURCE)),sorted(COMPOSITION_PATHS),'Unreviewed composition path set');
 // This foundational check accepts no later file changes. A separate reviewed
 // maintenance receipt is required before connecting it to production guards.
 assert.deepEqual(sorted(diff(COMPOSITION_SOURCE,head)),[],'Unreviewed changes after approved composition');
 for(const path of COMPOSITION_PATHS)assert.equal(read(head,path),read(COMPOSITION_SOURCE,path),'Approved composition source drift: '+path);
 for(const path of ['wrangler.jsonc','package.json','package-lock.json',
 '.github/workflows/cloudflare-production-promote.yml','acquisition-activation/consent.mjs',
 'activation-measurement/assets.mjs','shift-coach/worker.mjs','shift-coach/release-manifest.json',
 'public-seo-context.mjs','public-seo-organic-links.mjs','public-seo-organic-link-data.mjs'])
 assert.equal(read(head,path),read(COMPOSITION_BASE,path),'Approved composition protected boundary drift: '+path);
 return {source:COMPOSITION_SOURCE,base:COMPOSITION_BASE,head,paths:COMPOSITION_PATHS.length};
}

export const RELOAD_VERIFIER='8d84eb29eb74c3f156ce0ee815cc2d1c644be1e9';
export const RELOAD_RUN=37763695261;
export const RELOAD_PAYLOAD=['rendered-member-acceptance-support.mjs','tests/rendered-member-acceptance-support.test.mjs','tests/member-reload-browser.test.mjs'];
export const RECONCILIATION_MANIFEST='release/approved-runtime-composition.json';
export const RECONCILIATION_MAINTENANCE=[
 'release/approved-runtime-composition.mjs','tests/approved-runtime-composition.test.mjs',
 'release/organic-followthrough-scope.mjs','release/seo-link-repairs-scope.mjs',
 'release/seo-growth-scope.mjs','release/app-scope.mjs',
 'scripts/b1-release-scope.mjs','tests/organic-followthrough-release.test.mjs','release/device-health-scope.mjs','release/footer-scope.mjs','tests/seo-growth-release.test.mjs','release/owner-captured-runtime.mjs','tests/owner-captured-runtime.test.mjs','shift-coach/cancelled-release-recovery.mjs','shift-coach/recover-cancelled-release.mjs','release/growth-adopt-deployment.mjs','release/member-acceptance-scope.mjs','shift-coach/scope.mjs','shift-me-source-gate.mjs','.github/workflows/online-privacy-recovery-proof.yml','.github/workflows/shift-coach-integration.yml','.github/workflows/organic-followthrough-proof.yml','.github/workflows/seo-link-repairs-proof.yml','.github/workflows/seo-growth-proof.yml','acquisition-activation/metrics-release.test.mjs','shift-coach/release.test.mjs',...RELOAD_PAYLOAD];
export const RECONCILIATION_PATHS=new Set([...COMPOSITION_PATHS,...RECONCILIATION_MAINTENANCE,RECONCILIATION_MANIFEST]);
const recordPath=new URL('./approved-runtime-composition.json',import.meta.url);
export function reconciliationRecord(){return existsSync(recordPath)?JSON.parse(readFileSync(recordPath)):null;}
export function verifyReconciledRelease(read=(ref,path)=>git('rev-parse',ref+':'+path)){
 const c=reconciliationRecord();if(!c)return null;
 assert.equal(c.proof,'EXACT_APPROVED_RUNTIME_COMPOSITION_V1');
 assert.equal(c.base,COMPOSITION_BASE);assert.equal(c.source,COMPOSITION_SOURCE);
 assert.deepEqual(c.maintenancePaths,RECONCILIATION_MAINTENANCE);
 assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);
 const head=git('rev-parse','HEAD');
 for(const ref of [COMPOSITION_BASE,SUPPORT_SOURCE,HQ_SOURCE,COMPOSITION_SOURCE,c.maintenanceSource,RELOAD_VERIFIER])git('merge-base','--is-ancestor',ref,head);
 const diff=(a,b)=>git('diff','--name-only',a,b).split('\n').filter(Boolean).sort();
 assert.deepEqual(diff(COMPOSITION_BASE,COMPOSITION_SOURCE),sorted(COMPOSITION_PATHS));
 assert.deepEqual(diff(COMPOSITION_SOURCE,c.maintenanceSource).filter(p=>p!==RECONCILIATION_MANIFEST),sorted(RECONCILIATION_MAINTENANCE));
 assert.deepEqual(diff(c.maintenanceSource,head),[RECONCILIATION_MANIFEST]);
 // Verify current bytes before exposing historical views to older guards.
 for(const path of COMPOSITION_PATHS)assert.equal(read('HEAD',path),read(COMPOSITION_SOURCE,path),'Approved composition source / boundary drift: '+path);
 for(const path of RECONCILIATION_MAINTENANCE)assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Approved composition maintenance source drift: '+path);
 for(const path of RELOAD_PAYLOAD)assert.equal(read('HEAD',path),read(RELOAD_VERIFIER,path),'Independent reload harness source drift: '+path);
 assert.equal(git('diff','--name-only'),'','Working source changed during composition verification');
 return c;
}
const mappedCompositionReaders=new WeakSet();
export function reconciliationMarkHistoricalReader(read){mappedCompositionReaders.add(read);return read;}
let verifiedHead=null;const existsAtBase=new Map();
function ensureReconciliation(){
 if(!reconciliationRecord())return false;
 const head=git('rev-parse','HEAD');
 if(verifiedHead!==head){verifyReconciledRelease();verifiedHead=head;}
 return true;
}
function checkedHistoricalRef(ref,path){
 if(ref!=='HEAD'||!RECONCILIATION_PATHS.has(path))return ref;
 if(!existsAtBase.has(path)){try{execFileSync('git',['cat-file','-e',COMPOSITION_BASE+':'+path],{stdio:'ignore'});existsAtBase.set(path,true);}catch{existsAtBase.set(path,false);}}
 return existsAtBase.get(path)?COMPOSITION_BASE:ref;
}
export function reconciliationHistoricalRef(ref,path){
 if(ref!=='HEAD'||!RECONCILIATION_PATHS.has(path)||!ensureReconciliation())return ref;
 return checkedHistoricalRef(ref,path);
}
export function reconciliationHistoricalRead(read,verifyReader=false){
 if(!ensureReconciliation()||mappedCompositionReaders.has(read))return read;if(verifyReader)verifyReconciledRelease(read);
 // This synchronous validation reader is created only after the actual HEAD and
 // all current source blobs pass. Its immutable base map needs no per-blob Git
 // subprocess. Fresh readers still recheck current source before this mapping.
 return reconciliationMarkHistoricalReader((ref,path)=>read(checkedHistoricalRef(ref,path),path));
}
export function reconciliationGitArgs(args){
 if(!['show','rev-parse'].includes(args[0])||!args[1]?.startsWith('HEAD:'))return args;
 const path=args[1].slice(5),ref=reconciliationHistoricalRef('HEAD',path);
 return [args[0],ref+':'+path,...args.slice(2)];
}
export function reconciliationHead(){return ensureReconciliation()?COMPOSITION_BASE:git('rev-parse','HEAD');}
export function reconciliationPath(path){return RECONCILIATION_PATHS.has(path)&&ensureReconciliation();}
export function reconciliationChangedPath(status,path){
 if(!reconciliationPath(path))return false;
 if(!existsAtBase.has(path)){try{execFileSync('git',['cat-file','-e',COMPOSITION_BASE+':'+path],{stdio:'ignore'});existsAtBase.set(path,true);}catch{existsAtBase.set(path,false);}}
 // Source changes retain their exact add/modify semantics. Existing verifier
 // maintenance may have been added historically and modified subsequently.
 const allowed=existsAtBase.get(path)?(RECONCILIATION_MAINTENANCE.includes(path)?['A','M']:['M']):['A'];
 assert(allowed.includes(status),'Unexpected approved composition file status: '+status+' '+path);
 return true;
}


export function assertReconciledReloadReceipt(run,job){
 assert.equal(run?.id,RELOAD_RUN);assert.equal(run.head_sha,RELOAD_VERIFIER);
 assert.equal(run.path,'.github/workflows/my-timber-final-production.yml');assert.equal(run.head_branch,'fix/member-reload-navigation-20261007');assert.equal(run.event,'push');assert.equal(run.status,'completed');assert.equal(run.conclusion,'success');
 assert.equal(job?.id,113266037954);assert.equal(job.run_id,RELOAD_RUN);assert.equal(job.name,'reload-navigation-diagnostics');assert.equal(job.status,'completed');assert.equal(job.conclusion,'success');
 for(const number of [8,9,11,12,14,15])assert(job.steps?.some(s=>s.number===number&&s.status==='completed'&&s.conclusion==='success'),'Every complete live journey round must pass');
 return {id:run.id,sha:run.head_sha,path:run.path,conclusion:run.conclusion,scope:'Three complete live save, reload, privacy, Today, Grub and Fit journey rounds'};
}
