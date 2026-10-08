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
 'scripts/b1-release-scope.mjs','tests/organic-followthrough-release.test.mjs','release/device-health-scope.mjs','release/footer-scope.mjs','tests/seo-growth-release.test.mjs','release/owner-captured-runtime.mjs','tests/owner-captured-runtime.test.mjs','shift-coach/cancelled-release-recovery.mjs','shift-coach/recover-cancelled-release.mjs','release/growth-adopt-deployment.mjs','release/member-acceptance-scope.mjs','shift-coach/scope.mjs','shift-me-source-gate.mjs','release/metrics-connection-scope.mjs','release/seo-context-scope.mjs','release/seo-discovery-scope.mjs','release/seo-follow-through-scope.mjs','release/fit-300-scope.mjs','tests/production-completion-release.test.mjs','.github/workflows/cloudflare-production-promote.yml','.github/workflows/online-privacy-recovery-proof.yml','.github/workflows/shift-coach-integration.yml','.github/workflows/organic-followthrough-proof.yml','.github/workflows/seo-link-repairs-proof.yml','.github/workflows/seo-growth-proof.yml','acquisition-activation/metrics-release.test.mjs','shift-coach/release.test.mjs','tests/growth-release.test.mjs','shift-coach/browser-proof.mjs','shift-coach/full-page-proof.mjs','shift-coach/phantom-members.mjs','shift-coach/browser-journey-support.mjs','release/watch-registry-wave-scope.mjs','release/sitewide-seo-scope.mjs','release/treatment-guidance-scope.mjs',...RELOAD_PAYLOAD];
// A finite factual amendment after the independently checked runtime composition.
// Neither its exact eight-file source nor its hosted proof can be replaced by a
// matching path prefix, later commit, successful HTTP check or editorial authority.
export const WATCH_FACTUAL_UPDATE_BASE='56bba771e9a4006b788bd8fb40358baa3d737dd0';
export const WATCH_FACTUAL_UPDATE_SOURCE='66236803a719f13d212ad27d032c87e699c9418c';
export const WATCH_FACTUAL_UPDATE_RUN=37797195698;
export const WATCH_FACTUAL_UPDATE_PATHS=['medicines-watch/README.md','medicines-watch/credibility.mjs','medicines-watch/credibility.test.mjs','medicines-watch/evidence-desk.test.mjs','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/knowledge.test.mjs','medicines-watch/reviews/2026-10-08-authorised-zupreme-lifecycle-update.json'];
export const WATCH_FACTUAL_UPDATE_MAINTENANCE=['release/approved-runtime-composition.mjs','release/watch-registry-wave-scope.mjs','tests/approved-runtime-composition.test.mjs','shift-coach/release.test.mjs'];
export function assertWatchFactualUpdateProof(proof){
 assert.equal(proof.id,WATCH_FACTUAL_UPDATE_RUN);assert.equal(proof.head_sha,WATCH_FACTUAL_UPDATE_SOURCE);
 assert.equal(proof.path,'.github/workflows/medicines-watch-check.yml');assert.equal(proof.event,'pull_request');
 assert.equal(proof.head_branch,'review/watch-zupreme-lifecycle-20261008');
 assert.equal(proof.status,'completed');assert.equal(proof.conclusion,'success');return proof;
}
export async function verifyWatchFactualUpdateProof(get){return assertWatchFactualUpdateProof(await get('/actions/runs/'+WATCH_FACTUAL_UPDATE_RUN));}
// Finite engineering amendment: bounded read-only GitHub transport recovery.
export const PROOF_TRANSPORT_BASE='476a151c2c0d4aa28e098205d1b0bda64410a783';
export const PROOF_TRANSPORT_SOURCE='d601b545686a74dfe51c6f57a5712b11fba510f9';
export const PROOF_TRANSPORT_PATHS=['release/growth-preflight.mjs','release/github-proof-get.mjs','tests/github-proof-get.test.mjs'];
export const PROOF_TRANSPORT_MAINTENANCE=['release/approved-runtime-composition.mjs','tests/approved-runtime-composition.test.mjs'];
export const RECONCILIATION_PATHS=new Set([...COMPOSITION_PATHS,...RECONCILIATION_MAINTENANCE,RECONCILIATION_MANIFEST,...WATCH_FACTUAL_UPDATE_PATHS,...WATCH_FACTUAL_UPDATE_MAINTENANCE,...PROOF_TRANSPORT_PATHS,...PROOF_TRANSPORT_MAINTENANCE]);
export const PUBLIC_TOOL_BASE='e8592710a52bc0c7a551798bf426d32e59409caf';
export const PUBLIC_TOOL_SOURCE='33b2271d46b27872e41c7390244949744c10539c';
export const PUBLIC_TOOL_PAYLOAD=['public-tool-delivery.mjs','shift-coach/worker.mjs','tests/public-tool-delivery.test.mjs'];
export const PUBLIC_TOOL_MAINTENANCE=['release/approved-runtime-composition.mjs','tests/public-tool-release.test.mjs'];
const publicToolImmutableFacts=new Map();
const publicToolImmutableGit=(...args)=>{const key=JSON.stringify([process.cwd(),...args]);if(!publicToolImmutableFacts.has(key))publicToolImmutableFacts.set(key,git(...args));return publicToolImmutableFacts.get(key);};
const PUBLIC_TOOL_PATHS=new Set([...PUBLIC_TOOL_PAYLOAD,...PUBLIC_TOOL_MAINTENANCE]);
for(const path of PUBLIC_TOOL_PATHS)RECONCILIATION_PATHS.add(path);
export function verifyPublicToolExtension(c,{head,read,diff,ancestor}={}){
 assert(c,'Exact public-tool extension receipt required');
 assert.equal(c.proof,'EXACT_PUBLIC_TOOL_DELIVERY_V1');
 assert.equal(c.base,PUBLIC_TOOL_BASE);assert.equal(c.payloadSource,PUBLIC_TOOL_SOURCE);
 assert.deepEqual(c.payloadPaths,PUBLIC_TOOL_PAYLOAD);assert.deepEqual(c.maintenancePaths,PUBLIC_TOOL_MAINTENANCE);
 assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);assert.match(head,/^[a-f0-9]{40}$/);
 assert.equal(c.publicCopyChanged,false);assert.equal(c.ratingsInvented,false);
 assert.equal(c.homepageChanged,false);assert.equal(c.privateCacheChanged,false);
 for(const ref of [c.base,c.payloadSource,c.maintenanceSource])ancestor(ref,head);
 assert.deepEqual(sorted(diff(c.base,c.payloadSource)),sorted(PUBLIC_TOOL_PAYLOAD),'Unrelated public-tool payload change');
 assert.deepEqual(sorted(diff(c.payloadSource,c.maintenanceSource)),sorted(PUBLIC_TOOL_MAINTENANCE),'Unrelated public-tool verifier change');
 assert.deepEqual(sorted(diff(c.maintenanceSource,head)),[RECONCILIATION_MANIFEST],'Unreviewed changes after public-tool receipt');
 for(const path of PUBLIC_TOOL_PAYLOAD)assert.equal(read('HEAD',path),read(c.payloadSource,path),'Approved composition source / boundary drift: Public-tool payload source drift: '+path);
 for(const path of PUBLIC_TOOL_MAINTENANCE)assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Approved composition maintenance source drift: Public-tool maintenance source drift: '+path);
 return c;
}
const recordPath=new URL('./approved-runtime-composition.json',import.meta.url);
export function reconciliationRecord(){return existsSync(recordPath)?JSON.parse(readFileSync(recordPath)):null;}
export function assertProductionProofBudget(before,current){
 const marker='    timeout-minutes: 25\n    env:\n      CLOUDFLARE_ACCOUNT_ID';
 assert.equal(before.split(marker).length,2,'Exact original production time budget required');
 assert.equal(current,before.replace(marker,marker.replace('25','60')),'Only the production verification time budget may change');
}
let productionProofBefore;
const verifiedImmutableStructures=new Set();

// Synchronous test verification can reuse only actual immutable Git history.
// Current HEAD and tracked working bytes are checked at both scope boundaries.
// This never caches caller-supplied source readers or validation outcomes.
let immutableHistoryScope=null;
const immutableHistoryResults=new Map();
export function withImmutableHistoryVerification(callback){
 if(immutableHistoryScope)return callback();
 const cwd=process.cwd(),head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 assert.equal(execFileSync('git',['diff','--name-only'],{encoding:'utf8'}).trim(),'','Immutable history verification requires clean tracked source');
 immutableHistoryScope={cwd,head};
 try{const value=callback();assert(!value||typeof value.then!=='function','Immutable history verification must be synchronous');return value;}
 finally{
  immutableHistoryScope=null;
  assert.equal(process.cwd(),cwd,'Verification working directory changed');
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),head,'Source HEAD changed during immutable history verification');
  assert.equal(execFileSync('git',['diff','--name-only'],{encoding:'utf8'}).trim(),'','Working source changed during immutable history verification');
 }
}
export function immutableHistoryExecFileSync(bin,args,options){
 const scope=immutableHistoryScope;
 if(!scope||bin!=='git'||!Array.isArray(args)||args.some(x=>typeof x!=='string')||options?.cwd&&options.cwd!==scope.cwd||options?.env||options?.shell)return execFileSync(bin,args,options);
 const pinned=args.map(x=>x==='HEAD'?scope.head:x.startsWith('HEAD:')?scope.head+x.slice(4):x==='HEAD^{commit}'?scope.head+'^{commit}':x);
 const commit=x=>/^[a-f0-9]{40}$/.test(x),blob=x=>/^[a-f0-9]{40}:[^\0]+$/.test(x);
 const immutable=pinned.length===4&&pinned[0]==='merge-base'&&pinned[1]==='--is-ancestor'&&commit(pinned[2])&&commit(pinned[3])
  ||pinned.length===4&&pinned[0]==='diff'&&['--name-only','--name-status'].includes(pinned[1])&&commit(pinned[2])&&commit(pinned[3])
  ||pinned.length===2&&['show','rev-parse'].includes(pinned[0])&&blob(pinned[1])
  ||pinned.length===3&&pinned[0]==='cat-file'&&pinned[1]==='-e'&&(/^[a-f0-9]{40}\^\{commit\}$/.test(pinned[2])||blob(pinned[2]));
 if(!immutable)return execFileSync(bin,args,options);
 const key=JSON.stringify([scope.cwd,scope.head,pinned,options||null]);
 if(!immutableHistoryResults.has(key))immutableHistoryResults.set(key,execFileSync(bin,pinned,options));
 const result=immutableHistoryResults.get(key);return Buffer.isBuffer(result)?Buffer.from(result):result;
}

const defaultReconciliationRead=(ref,path)=>git('rev-parse',ref+':'+path);
const immutableCompositionBlobs=new Map();
export function verifyReconciledRelease(read=defaultReconciliationRead){
 const c=reconciliationRecord();if(!c)return null;
 assert.equal(c.proof,'EXACT_APPROVED_RUNTIME_COMPOSITION_V1');
 assert.equal(c.base,COMPOSITION_BASE);assert.equal(c.source,COMPOSITION_SOURCE);
 assert.deepEqual(c.maintenancePaths,RECONCILIATION_MAINTENANCE);
 assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);
 const watch=c.watchFactualUpdate;assert(watch,'Exact factual Watch amendment receipt required');
 assert.equal(watch.base,WATCH_FACTUAL_UPDATE_BASE);assert.equal(watch.source,WATCH_FACTUAL_UPDATE_SOURCE);
 assert.equal(watch.proofRun,WATCH_FACTUAL_UPDATE_RUN);assert.deepEqual(watch.paths,WATCH_FACTUAL_UPDATE_PATHS);
 assert.deepEqual(watch.maintenancePaths,WATCH_FACTUAL_UPDATE_MAINTENANCE);assert.match(watch.maintenanceSource,/^[a-f0-9]{40}$/);
 const transport=c.proofTransportUpdate;assert(transport,'Exact GitHub proof transport amendment required');
 assert.equal(transport.base,PROOF_TRANSPORT_BASE);assert.equal(transport.source,PROOF_TRANSPORT_SOURCE);
 assert.deepEqual(transport.paths,PROOF_TRANSPORT_PATHS);assert.deepEqual(transport.maintenancePaths,PROOF_TRANSPORT_MAINTENANCE);assert.match(transport.maintenanceSource,/^[a-f0-9]{40}$/);
 const head=git('rev-parse','HEAD');
 // Only actual Git objects at resolved immutable commit IDs are cacheable.
 // Supplied readers are always invoked again, even after a successful proof.
 const readBlob=read===defaultReconciliationRead?(ref,path)=>{
  const commit=ref==='HEAD'?head:ref;assert.match(commit,/^[a-f0-9]{40}$/);
  const key=JSON.stringify([process.cwd(),commit,path]);
  if(!immutableCompositionBlobs.has(key))immutableCompositionBlobs.set(key,defaultReconciliationRead(commit,path));
  return immutableCompositionBlobs.get(key);
 }:read;
 // Validate all new raw HEAD bytes before exposing any older historical view.
 const extension=c.publicToolDelivery;
 if(extension)verifyPublicToolExtension(extension,{head,read:readBlob,
  diff:(a,b)=>publicToolImmutableGit('diff','--name-only',a,b).split('\n').filter(Boolean),
  ancestor:(a,b)=>publicToolImmutableGit('merge-base','--is-ancestor',a,b)});
 const compositionHead=extension?extension.base:head;
 const compositionBlob=(path)=>extension&&PUBLIC_TOOL_PATHS.has(path)?readBlob(extension.base,path):readBlob('HEAD',path);
 // Cache only Git graph facts for resolved immutable commits and this exact
 // receipt. Supplied readers, current bytes and working-tree checks stay fresh.
 const structureKey=JSON.stringify([process.cwd(),head,c]);
 if(!verifiedImmutableStructures.has(structureKey)){
  for(const ref of [COMPOSITION_BASE,SUPPORT_SOURCE,HQ_SOURCE,COMPOSITION_SOURCE,c.maintenanceSource,RELOAD_VERIFIER,WATCH_FACTUAL_UPDATE_BASE,WATCH_FACTUAL_UPDATE_SOURCE,watch.maintenanceSource,PROOF_TRANSPORT_BASE,PROOF_TRANSPORT_SOURCE,transport.maintenanceSource])git('merge-base','--is-ancestor',ref,head);
  const diff=(a,b)=>git('diff','--name-only',a,b).split('\n').filter(Boolean).sort();
  assert.deepEqual(diff(COMPOSITION_BASE,COMPOSITION_SOURCE),sorted(COMPOSITION_PATHS));
  assert.deepEqual(diff(COMPOSITION_SOURCE,c.maintenanceSource).filter(p=>p!==RECONCILIATION_MANIFEST),sorted(RECONCILIATION_MAINTENANCE));
  assert.deepEqual(diff(c.maintenanceSource,WATCH_FACTUAL_UPDATE_BASE),[RECONCILIATION_MANIFEST]);
  assert.deepEqual(diff(WATCH_FACTUAL_UPDATE_BASE,WATCH_FACTUAL_UPDATE_SOURCE),sorted(WATCH_FACTUAL_UPDATE_PATHS),'Exact eight-file factual Watch source required');
  assert.deepEqual(diff(WATCH_FACTUAL_UPDATE_SOURCE,watch.maintenanceSource),sorted(WATCH_FACTUAL_UPDATE_MAINTENANCE),'Exact four-file Watch reconciliation required');
  assert.deepEqual(diff(watch.maintenanceSource,PROOF_TRANSPORT_BASE),[RECONCILIATION_MANIFEST],'Unreviewed changes after factual Watch reconciliation');
  assert.deepEqual(diff(PROOF_TRANSPORT_BASE,PROOF_TRANSPORT_SOURCE),sorted(PROOF_TRANSPORT_PATHS),'Exact three-file transport amendment required');
  assert.deepEqual(diff(PROOF_TRANSPORT_SOURCE,transport.maintenanceSource),sorted(PROOF_TRANSPORT_MAINTENANCE),'Exact two-file transport reconciliation required');
  assert.deepEqual(diff(transport.maintenanceSource,compositionHead),[RECONCILIATION_MANIFEST],'Unreviewed changes after transport reconciliation');
  verifiedImmutableStructures.add(structureKey);
 }
 // Verify current bytes before exposing historical views to older guards.
 for(const path of COMPOSITION_PATHS)assert.equal(compositionBlob(path),readBlob(COMPOSITION_SOURCE,path),'Approved composition source / boundary drift: '+path);
 for(const path of RECONCILIATION_MAINTENANCE)assert.equal(compositionBlob(path),readBlob(PROOF_TRANSPORT_MAINTENANCE.includes(path)?transport.maintenanceSource:WATCH_FACTUAL_UPDATE_MAINTENANCE.includes(path)?watch.maintenanceSource:c.maintenanceSource,path),'Approved composition maintenance source drift: '+path);
 for(const path of WATCH_FACTUAL_UPDATE_MAINTENANCE)assert.equal(compositionBlob(path),readBlob(PROOF_TRANSPORT_MAINTENANCE.includes(path)?transport.maintenanceSource:watch.maintenanceSource,path),'Approved factual Watch maintenance source drift: '+path);
 for(const path of WATCH_FACTUAL_UPDATE_PATHS)assert.equal(compositionBlob(path),readBlob(WATCH_FACTUAL_UPDATE_SOURCE,path),'Approved factual Watch source drift: '+path);
 for(const path of PROOF_TRANSPORT_PATHS)assert.equal(compositionBlob(path),readBlob(PROOF_TRANSPORT_SOURCE,path),'Approved composition maintenance source drift: '+path);
 for(const path of PROOF_TRANSPORT_MAINTENANCE)assert.equal(compositionBlob(path),readBlob(transport.maintenanceSource,path),'Approved composition maintenance source drift: '+path);
 for(const path of RELOAD_PAYLOAD)assert.equal(compositionBlob(path),readBlob(RELOAD_VERIFIER,path),'Independent reload harness source drift: '+path);
 productionProofBefore??=execFileSync('git',['show',COMPOSITION_BASE+':.github/workflows/cloudflare-production-promote.yml'],{encoding:'utf8'});
 assertProductionProofBudget(productionProofBefore,readFileSync('.github/workflows/cloudflare-production-promote.yml','utf8'));
 assert.equal(git('diff','--name-only'),'','Working source changed during composition verification');
 assert.equal(git('rev-parse','HEAD'),head,'Source HEAD changed during composition verification');
 return c;
}
const mappedCompositionReaders=new WeakSet();
export function reconciliationMarkHistoricalReader(read){mappedCompositionReaders.add(read);return read;}
let verifiedHead=null;const existsAtBase=new Map();
function ensureReconciliation(){
 if(!reconciliationRecord())return false;
 // A synchronous historical test scope captures HEAD and rejects a move at
 // its end. Outside that scope, every public lookup still resolves HEAD afresh.
 const head=immutableHistoryScope?.head??git('rev-parse','HEAD');
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
 const allowed=existsAtBase.get(path)?(PUBLIC_TOOL_MAINTENANCE.includes(path)||RECONCILIATION_MAINTENANCE.includes(path)||WATCH_FACTUAL_UPDATE_PATHS.includes(path)||PROOF_TRANSPORT_PATHS.includes(path)?['A','M']:['M']):['A'];
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
