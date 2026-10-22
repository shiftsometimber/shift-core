import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

export const MAIN_RELEASE_BASE='39c703ac068b800bbf4a92a9277e21bd3d7b89e6';
export const MAIN_RELEASE_PAYLOAD='e85fe30291663f37d800009a9199620d6e2f1cb6';
export const MAIN_RELEASE_ORIGINAL_RECEIPT='aec895cc2543f83f8dd7af0111850745605b95a6';
export const MAIN_RELEASE_FOLLOWUP_PAYLOAD='35eb63b29bb2e617775aa900ffaa657ad6a9b384';
export const MAIN_RELEASE_TIMEOUT_BASE='fc0baf8d2e41c577590531cb0fc9d178a6297b63';
export const MAIN_RELEASE_TIMEOUT_PAYLOAD='0f9a1a299b65b4cc661b178b15b244a0265fef5c';
export const MAIN_RELEASE_RECEIPT='release/main-release-readiness-scope-20261021.json';
export const MAIN_LIVE_HEADER_CSS_SHA256='74b8c12bc157dfab638bb1202a3358d12b6a47bd5932c5df5480a1c887a3ef6d';

const ORIGINAL_PATHS=Object.freeze(['.github/workflows/programme-day-preview.yml','release/app-scope.mjs','reta-styles-data.mjs','wrangler.coaching.jsonc']);
const ORIGINAL_MAINTENANCE=Object.freeze(['release/health-vision-scope-20261021.mjs','release/main-release-readiness-scope-20261021.mjs','tests/main-release-readiness-scope-20261021.test.mjs']);
const FOLLOWUP_PATHS=Object.freeze(['.github/workflows/programme-day-preview.yml','.github/workflows/shift-coach-integration.yml','release/app-preflight.mjs','release/root-share-preview-scope.mjs','tests/bounded-source-scheduling-20261016.test.mjs','tests/combined-legacy-projection-20261014.test.mjs','tests/combined-organic-admission-negative-20261014.test.mjs','tests/food-diary-london-date-stack-20261015.test.mjs','tests/recorded-week-browser-repair-20261017.test.mjs','tests/root-share-preview.test.mjs','tests/website-editorial-scope-20261018.test.mjs']);
const FOLLOWUP_MAINTENANCE=Object.freeze(['release/main-release-readiness-scope-20261021.mjs','tests/main-release-readiness-scope-20261021.test.mjs']);
const TIMEOUT_PATHS=Object.freeze(['.github/workflows/organic-followthrough-proof.yml','release/root-share-preview-scope.mjs','release/photo-calendar-scope.mjs']);
const TIMEOUT_MAINTENANCE=Object.freeze(['release/main-release-readiness-scope-20261021.mjs','tests/main-release-readiness-scope-20261021.test.mjs']);
const PROGRAMME_TRIGGER_PATHS=Object.freeze(['release/app-preflight.mjs','release/root-share-preview-scope.mjs','tests/bounded-source-scheduling-20261016.test.mjs','tests/combined-legacy-projection-20261014.test.mjs','tests/combined-organic-admission-negative-20261014.test.mjs','tests/food-diary-london-date-stack-20261015.test.mjs','tests/recorded-week-browser-repair-20261017.test.mjs','tests/root-share-preview.test.mjs','tests/website-editorial-scope-20261018.test.mjs']);
export const MAIN_RELEASE_PATHS=Object.freeze([...new Set([...ORIGINAL_PATHS,...FOLLOWUP_PATHS,...TIMEOUT_PATHS])]);
export const MAIN_RELEASE_MAINTENANCE=Object.freeze([...new Set([...ORIGINAL_MAINTENANCE,...FOLLOWUP_MAINTENANCE,...TIMEOUT_MAINTENANCE])]);

const originalExpected={"kind":"EXACT_CURRENT_MAIN_RELEASE_READINESS_REPAIR_20261021","base":"39c703ac068b800bbf4a92a9277e21bd3d7b89e6","payload":"e85fe30291663f37d800009a9199620d6e2f1cb6","paths":[".github/workflows/programme-day-preview.yml","release/app-scope.mjs","reta-styles-data.mjs","wrangler.coaching.jsonc"],"maintenancePaths":["release/health-vision-scope-20261021.mjs","release/main-release-readiness-scope-20261021.mjs","tests/main-release-readiness-scope-20261021.test.mjs"],"observedFailures":{"production":{"run":39650793172,"job":119398602832,"source":"39c703ac068b800bbf4a92a9277e21bd3d7b89e6","deploymentPerformed":false,"failedBeforeMutation":true,"failures":["unadmitted Health extension in app scope","stale wrangler.coaching.jsonc fixture","live header-navigation-v2.css bytes absent from current source"]},"programme":{"run":39626334852,"job":119312440952,"reason":"maximum execution time 6h0m0s after 594 passing assertions and zero observed failures"}},"repair":{"appAdmission":"Health and this exact repair are admitted only after their independent immutable verifiers pass","coachingFixture":"wrangler.coaching.jsonc is byte-identical to unchanged wrangler.jsonc","publicCss":"header-navigation-v2 source is reconciled to the already-active live bytes","activeHeaderCssSha256":"74b8c12bc157dfab638bb1202a3358d12b6a47bd5932c5df5480a1c887a3ef6d","programmeSourceTestConcurrency":2,"workflowTaskConcurrency":2,"sourceTestFilesChanged":false,"sourceTestSelectionChanged":false,"sourceAssertionsRemoved":0,"memberRuntimeChanged":false,"homepageBodyChanged":false,"clinicalSafetyChanged":false,"privacyOrConsentChanged":false,"memberRecordsChanged":false,"stockChanged":false,"commercialSettingsChanged":false},"authority":{"myTimberDeploymentApproved":true,"publicHomepageChangeApproved":false,"clinicalActivationApproved":false,"unrelatedChangesApproved":false},"productionVerified":false};
const followupExpected={
 kind:'EXACT_TERMINAL_RELEASE_GATE_REPAIR_20261022',base:MAIN_RELEASE_ORIGINAL_RECEIPT,payload:MAIN_RELEASE_FOLLOWUP_PAYLOAD,paths:[...FOLLOWUP_PATHS],maintenancePaths:[...FOLLOWUP_MAINTENANCE],
 observedFailures:{
  integration:{run:39684371014,job:119514568491,conclusion:'cancelled',reason:'maximum execution time 4h0m0s',artifact:{id:12396870990,sha256:'827e1e8f7ecf11d1ccbc8c0c1ee40a3f7bec546490684eba3c81e633de671b26',bytes:72009,files:46},failedTests:['tests/combined-legacy-projection-20261014.test.mjs: independent actual Git proof','tests/combined-organic-admission-negative-20261014.test.mjs: missing-ledger','tests/combined-organic-admission-negative-20261014.test.mjs: unknown-tail','tests/combined-organic-admission-negative-20261014.test.mjs: missing-ledger-protected-change','tests/root-share-preview.test.mjs: prepared Worker hook']},
  programme:{run:39684370994,job:119514568575,conclusion:'cancelled',reason:'maximum execution time 6h0m0s',artifact:{id:12400843668,sha256:'cc9c51fa935dabe58830e9a24e78742d5a770eab490356e6754dc115624b659c',bytes:96733},sourceTestsLastCompleted:335,failures:['website editorial isolated HEAD-move child exceeded 45 seconds','recorded-week fixture expected pre-reconciliation coaching config','bounded overlap fixture used a 40ms race window','Growth preflight compared verified Health paths with the pre-Health app preview']},
  programmeSingleFileEvidence:{run:39626334852,job:119312440952,artifact:{id:12383291644,sha256:'95c66bd4678c0e8119aa2375bec981087fcd165a175effa912e16a0024663dc8',bytes:110874},sourceTestsLastCompleted:617,observedFailures:0,nextTest:'Combined native Original binding exact prior102 restoration'},
  publicAlias:{run:39724771343,job:119646059468,conclusion:'failure',failure:'Legacy reporting drift assertion received the exact repaired root-share test before its historical projection'}
 },
 repair:{integrationWorkflowTimeoutMinutes:360,integrationWorkflowTaskConcurrency:2,standaloneCloneFixtures:true,objectAlternatesRemoved:true,workingTreeSyncedToSyntheticCommit:true,rootShareHistoricalPreparedSource:'da67872e84109577d5c6e6eff5cb9a85206c537f',rootShareHistoricalBaseline:'7a74a7d4a29421a540e67786fa83b7e6ac44b6c0',rootShareHistoricalProjectionReconciled:true,programmeSourceTestConcurrency:1,programmeWorkflowTaskConcurrency:2,programmeTriggerPaths:[...PROGRAMME_TRIGGER_PATHS],immutableHistoryReuseForLongTest:true,headMoveFixtureTimeoutMs:120000,boundedOverlapDelayMs:500,healthAndMainReleasePathsIndependentlyAdmitted:true,coachingFixtureAssertionReconciled:true,sourceTestSelectionChanged:false,sourceAssertionsRemoved:0,memberRuntimeChanged:false,homepageBodyChanged:false,clinicalSafetyChanged:false,privacyOrConsentChanged:false,memberRecordsChanged:false,stockChanged:false,commercialSettingsChanged:false},
 authority:{myTimberDeploymentApproved:true,publicHomepageChangeApproved:false,clinicalActivationApproved:false,unrelatedChangesApproved:false},productionVerified:false
};
const timeoutExpected={
 kind:'EXACT_PUBLIC_ALIAS_RUNTIME_CAP_REPAIR_20261022',base:MAIN_RELEASE_TIMEOUT_BASE,payload:MAIN_RELEASE_TIMEOUT_PAYLOAD,paths:[...TIMEOUT_PATHS],maintenancePaths:[...TIMEOUT_MAINTENANCE],
 evidence:{hostedRun:39733153504,hostedConclusion:'cancelled',priorHostedCapMinutes:30,localExactWorkloadExceededSeconds:3600,observedAssertionFailuresAtBoundary:0,activeTest:'acquisition-activation/metrics-release.test.mjs'},
 repair:{publicAliasWorkflowTimeoutMinutes:120,publicAliasTestConcurrency:2,defaultRootShareHistoricalReaderProjected:true,photoCalendarRootInverseComposed:true,sourceTestSelectionChanged:false,sourceAssertionsRemoved:0,memberRuntimeChanged:false,homepageBodyChanged:false,clinicalSafetyChanged:false,privacyOrConsentChanged:false,memberRecordsChanged:false,stockChanged:false,commercialSettingsChanged:false},
 authority:{myTimberDeploymentApproved:true,publicHomepageChangeApproved:false,clinicalActivationApproved:false,unrelatedChangesApproved:false},productionVerified:false
};

const git=(...args)=>execFileSync('git',['--no-replace-objects',...args],{encoding:'utf8',maxBuffer:64e6}).trimEnd();
const content=(ref,path)=>execFileSync('git',['--no-replace-objects','show',ref+':'+path],{encoding:'utf8',maxBuffer:64e6});
const changed=(a,b)=>git('diff','--no-renames','--name-only',a,b).split('\n').filter(Boolean);
const sorted=xs=>[...xs].sort(),sha=value=>createHash('sha256').update(value).digest('hex');
const occurrences=(source,needle)=>source.split(needle).length-1;
const testNames=source=>[...source.matchAll(/\btest\('([^']*)'/g)].map(match=>match[1]);
function reta(ref){const source=content(ref,'reta-styles-data.mjs'),prefix='export const RETA_STYLES=';assert(source.startsWith(prefix)&&source.endsWith(';\n'),'Exact RETA source envelope required');return JSON.parse(source.slice(prefix.length,-2));}
function regularAt(ref,path){assert(git('ls-tree',ref,'--',path).startsWith('100644 blob '),'Regular release-readiness source required: '+path);}
function retainedTests(name,prior,current){assert.deepEqual(testNames(current),testNames(prior),name+' test selection changed');assert((current.match(/assert\./g)||[]).length>=(prior.match(/assert\./g)||[]).length,name+' assertions removed');}

export function verifyMainReleaseReadinessExtension(){
 const actual=git('rev-parse','HEAD');
 assert.equal(git('diff','--name-only','HEAD','--'),'','Release-readiness tracked source changed');
 assert.equal(git('diff','--cached','--name-only','--'),'','Release-readiness staged source changed');
 assert.equal(git('for-each-ref','--format=%(refname)','refs/replace'),'','Release-readiness replacement history forbidden');
 for(const row of git('ls-files','-v','-z').split('\0').filter(Boolean))assert(row.startsWith('H '),'Release-readiness hidden source forbidden');

 const finalReceipt=JSON.parse(content(actual,MAIN_RELEASE_RECEIPT));
 const {maintenanceSource:originalMaintenanceSource,followup,timeoutFollowup,...originalRecord}=finalReceipt;
 assert.deepEqual(originalRecord,originalExpected,'Original current-main repair authority changed');
 assert.match(originalMaintenanceSource,/^[a-f0-9]{40}$/);
 assert.deepEqual(JSON.parse(content(MAIN_RELEASE_ORIGINAL_RECEIPT,MAIN_RELEASE_RECEIPT)),{...originalExpected,maintenanceSource:originalMaintenanceSource},'Original immutable repair receipt changed');
 const {maintenanceSource:followupMaintenanceSource,...followupRecord}=followup||{};
 assert.deepEqual(followupRecord,followupExpected,'Only the exact terminal-gate follow-up is authorised');
 assert.match(followupMaintenanceSource,/^[a-f0-9]{40}$/);
 const {maintenanceSource:timeoutMaintenanceSource,...timeoutRecord}=timeoutFollowup||{};
 assert.deepEqual(timeoutRecord,timeoutExpected,'Only the exact evidenced Public Alias runtime repair is authorised');
 assert.match(timeoutMaintenanceSource,/^[a-f0-9]{40}$/);

 for(const [a,b,list] of [[MAIN_RELEASE_BASE,MAIN_RELEASE_PAYLOAD,ORIGINAL_PATHS],[MAIN_RELEASE_PAYLOAD,originalMaintenanceSource,ORIGINAL_MAINTENANCE],[originalMaintenanceSource,MAIN_RELEASE_ORIGINAL_RECEIPT,[MAIN_RELEASE_RECEIPT]],[MAIN_RELEASE_ORIGINAL_RECEIPT,MAIN_RELEASE_FOLLOWUP_PAYLOAD,FOLLOWUP_PATHS],[MAIN_RELEASE_FOLLOWUP_PAYLOAD,followupMaintenanceSource,FOLLOWUP_MAINTENANCE],[followupMaintenanceSource,MAIN_RELEASE_TIMEOUT_BASE,[MAIN_RELEASE_RECEIPT]],[MAIN_RELEASE_TIMEOUT_BASE,MAIN_RELEASE_TIMEOUT_PAYLOAD,TIMEOUT_PATHS],[MAIN_RELEASE_TIMEOUT_PAYLOAD,timeoutMaintenanceSource,TIMEOUT_MAINTENANCE],[timeoutMaintenanceSource,actual,[MAIN_RELEASE_RECEIPT]]]){
  git('merge-base','--is-ancestor',a,b);assert.deepEqual(sorted(changed(a,b)),sorted(list),'Exact release-readiness increment required');
 }
 const netPaths=[...new Set([...ORIGINAL_PATHS,...ORIGINAL_MAINTENANCE,...FOLLOWUP_PATHS,...FOLLOWUP_MAINTENANCE,...TIMEOUT_PATHS,...TIMEOUT_MAINTENANCE,MAIN_RELEASE_RECEIPT])];
 assert.deepEqual(sorted(changed(MAIN_RELEASE_BASE,actual)),sorted(netPaths),'Unrelated release-readiness change rejected');

 for(const path of ORIGINAL_PATHS.filter(path=>path!=='.github/workflows/programme-day-preview.yml')){assert.equal(git('rev-parse',actual+':'+path),git('rev-parse',MAIN_RELEASE_PAYLOAD+':'+path),'Pinned original repair bytes changed: '+path);regularAt(actual,path);}
 for(const path of ORIGINAL_MAINTENANCE){assert.equal(git('rev-parse',MAIN_RELEASE_ORIGINAL_RECEIPT+':'+path),git('rev-parse',originalMaintenanceSource+':'+path),'Pinned original maintenance bytes changed: '+path);regularAt(MAIN_RELEASE_ORIGINAL_RECEIPT,path);}
 assert.equal(git('rev-parse',actual+':release/health-vision-scope-20261021.mjs'),git('rev-parse',originalMaintenanceSource+':release/health-vision-scope-20261021.mjs'),'Health verifier changed in follow-up');
 for(const path of FOLLOWUP_PATHS.filter(path=>!TIMEOUT_PATHS.includes(path))){assert.equal(git('rev-parse',actual+':'+path),git('rev-parse',MAIN_RELEASE_FOLLOWUP_PAYLOAD+':'+path),'Pinned terminal-gate repair bytes changed: '+path);regularAt(actual,path);}
 for(const path of FOLLOWUP_MAINTENANCE.filter(path=>!TIMEOUT_MAINTENANCE.includes(path))){assert.equal(git('rev-parse',actual+':'+path),git('rev-parse',followupMaintenanceSource+':'+path),'Pinned follow-up maintenance bytes changed: '+path);regularAt(actual,path);}
 for(const path of TIMEOUT_PATHS){assert.equal(git('rev-parse',actual+':'+path),git('rev-parse',MAIN_RELEASE_TIMEOUT_PAYLOAD+':'+path),'Pinned Public Alias runtime repair bytes changed: '+path);regularAt(actual,path);}
 for(const path of TIMEOUT_MAINTENANCE){assert.equal(git('rev-parse',actual+':'+path),git('rev-parse',timeoutMaintenanceSource+':'+path),'Pinned Public Alias maintenance bytes changed: '+path);regularAt(actual,path);}
 regularAt(actual,MAIN_RELEASE_RECEIPT);

 assert.equal(git('rev-parse',actual+':release/approved-runtime-composition.json'),git('rev-parse',MAIN_RELEASE_BASE+':release/approved-runtime-composition.json'),'Previous approval ledger changed');
 assert.equal(git('rev-parse',actual+':wrangler.jsonc'),git('rev-parse',MAIN_RELEASE_BASE+':wrangler.jsonc'),'Production configuration changed');
 assert.equal(content(MAIN_RELEASE_PAYLOAD,'wrangler.coaching.jsonc'),content(MAIN_RELEASE_PAYLOAD,'wrangler.jsonc'),'Coaching fixture must equal unchanged production configuration');

 const baseProgramme=content(MAIN_RELEASE_BASE,'.github/workflows/programme-day-preview.yml'),firstProgramme=content(MAIN_RELEASE_PAYLOAD,'.github/workflows/programme-day-preview.yml'),finalProgramme=content(MAIN_RELEASE_FOLLOWUP_PAYLOAD,'.github/workflows/programme-day-preview.yml');
 assert.equal(occurrences(baseProgramme,'--test-concurrency=1'),1);assert.equal(firstProgramme,baseProgramme.replace('--test-concurrency=1','--test-concurrency=2'),'Only the original bounded Programme scheduling attempt may change');
 const restoredProgramme=firstProgramme.replace('--test-concurrency=2','--test-concurrency=1'),triggerAnchor='".github/workflows/programme-day-preview.yml"]';assert.equal(occurrences(restoredProgramme,triggerAnchor),1,'One exact Programme pull-request trigger boundary required');
 const expectedProgramme=restoredProgramme.replace(triggerAnchor,'".github/workflows/programme-day-preview.yml", '+PROGRAMME_TRIGGER_PATHS.map(JSON.stringify).join(', ')+']');
 assert.equal(finalProgramme,expectedProgramme,'Programme commands and task pool must restore exactly while repaired source paths trigger the gate');
 assert.equal(occurrences(finalProgramme,'const maxConcurrent=2;'),1,'Two Programme task slots must be preserved');
 const before=reta(MAIN_RELEASE_BASE),after=reta(MAIN_RELEASE_PAYLOAD),key='/assets/header-navigation-v2.css';
 assert.deepEqual(Object.keys(after),Object.keys(before));for(const name of Object.keys(before))if(name!==key)assert.equal(after[name],before[name],'Unrelated public CSS changed: '+name);
 assert(after[key].startsWith(before[key]));assert.equal(after[key].slice(before[key].length),'\n/* Header logo: one self-contained brand asset, with its original proportions. */\nhtml body header.site-header[data-header-v2][data-header-style] .header-inner{height:100%!important;min-height:0!important;align-items:center!important}\nhtml body header.site-header[data-header-v2][data-header-style] .site-logo{display:flex!important;align-items:center!important;line-height:0!important}\nhtml body header.site-header[data-header-v2][data-header-style] .site-logo img{display:block!important;margin:0!important;content:url("/assets/header-logo-20261020-v2.svg")!important;clip-path:none!important;filter:none!important;object-fit:contain!important;object-position:center!important}\nhtml body header.site-header[data-header-v2][data-header-style] .site-logo::after{content:none!important;display:none!important}\n');
 assert.equal(sha(after[key]),MAIN_LIVE_HEADER_CSS_SHA256,'Header CSS must equal retained active live bytes');

 const beforeIntegration=content(MAIN_RELEASE_ORIGINAL_RECEIPT,'.github/workflows/shift-coach-integration.yml'),afterIntegration=content(MAIN_RELEASE_FOLLOWUP_PAYLOAD,'.github/workflows/shift-coach-integration.yml');
 assert.equal(occurrences(beforeIntegration,'timeout-minutes: 240'),1);assert.equal(afterIntegration,beforeIntegration.replace('timeout-minutes: 240','timeout-minutes: 360'),'Only the evidenced Integration job timeout may change');assert.equal(occurrences(afterIntegration,'const maxConcurrent=2;'),1,'Two global Integration slots must be preserved');

 const prior=(path)=>content(MAIN_RELEASE_ORIGINAL_RECEIPT,path),current=(path)=>content(MAIN_RELEASE_FOLLOWUP_PAYLOAD,path);
 for(const [name,path] of [['combined legacy','tests/combined-legacy-projection-20261014.test.mjs'],['organic admission','tests/combined-organic-admission-negative-20261014.test.mjs']]){
  const old=prior(path),now=current(path);retainedTests(name,old,now);assert.equal(occurrences(now,'.git/objects/info/alternates'),0,name+' still bypasses ordinary Git objects');assert.equal(occurrences(now,"'clone','--no-hardlinks','--quiet'"),1,name+' must use one standalone clone');assert.equal(occurrences(now,"'checkout-index','--all','--force'"),1,name+' synthetic commit must be reflected in its worktree');assert(now.includes('Exact release-readiness increment required'),name+' must recognise the stronger outer admission rejection');
 }
 assert(current('tests/combined-organic-admission-negative-20261014.test.mjs').includes('assert.equal(calls,0)'),'Organic rejection must still precede fabricated callback execution');
 const rootOld=prior('tests/root-share-preview.test.mjs'),rootNow=current('tests/root-share-preview.test.mjs');retainedTests('root-share',rootOld,rootNow);assert(rootNow.includes("current.split(importHook).length,2")&&rootNow.includes("current.split(wrapperHook).length,2"),'Current root-share hook presence must remain checked');assert(rootNow.includes('da67872e84109577d5c6e6eff5cb9a85206c537f:shift-coach/worker.mjs'));assert(rootNow.includes("7a74a7d4:shift-coach/worker.mjs"));

 const editorialOld=prior('tests/website-editorial-scope-20261018.test.mjs'),editorialNow=current('tests/website-editorial-scope-20261018.test.mjs');retainedTests('website editorial',editorialOld,editorialNow);assert.equal(editorialNow,editorialOld.replace('timeout:45000','timeout:120000'),'Only the observed isolated-child timeout may change');
 const boundedOld=prior('tests/bounded-source-scheduling-20261016.test.mjs'),boundedNow=current('tests/bounded-source-scheduling-20261016.test.mjs');retainedTests('bounded scheduling',boundedOld,boundedNow);assert.equal(boundedNow,boundedOld.replace('delay=40','delay=500'),'Only the overlap fixture window may change');
 const foodOld=prior('tests/food-diary-london-date-stack-20261015.test.mjs'),foodNow=current('tests/food-diary-london-date-stack-20261015.test.mjs');retainedTests('Food history',foodOld,foodNow);assert.equal(occurrences(foodNow,"exact prior102 whole-source restoration and all earlier records remain required',()=>withWatchFixtureHistory(()=>{"),1);assert.equal((foodNow.match(/withWatchFixtureHistory\(/g)||[]).length,(foodOld.match(/withWatchFixtureHistory\(/g)||[]).length+1,'One immutable-history reuse boundary must be added without removing assertions');
 const recordedOld=prior('tests/recorded-week-browser-repair-20261017.test.mjs'),recordedNow=current('tests/recorded-week-browser-repair-20261017.test.mjs');retainedTests('recorded-week browser',recordedOld,recordedNow);assert(recordedNow.includes("assert.equal(readFileSync('wrangler.coaching.jsonc','utf8'),readFileSync('wrangler.jsonc','utf8')"),'Current approved coaching reconciliation must remain asserted');
 const preflight=current('release/app-preflight.mjs');assert(preflight.includes("from './health-vision-scope-20261021.mjs'")&&preflight.includes("from './main-release-readiness-scope-20261021.mjs'"));assert(preflight.includes('metricsPreflightPath(p)||currentReleasePaths.has(p)'),'Only independently verified Health/main-release paths may bypass the obsolete preview comparison');

 const aliasBefore=content(MAIN_RELEASE_TIMEOUT_BASE,'.github/workflows/organic-followthrough-proof.yml'),aliasAfter=content(MAIN_RELEASE_TIMEOUT_PAYLOAD,'.github/workflows/organic-followthrough-proof.yml');
 assert.equal(aliasAfter,aliasBefore.replace('timeout-minutes: 30','timeout-minutes: 120').replace('node --test tests/organic-followthrough-live.test.mjs','node --test --test-concurrency=2 tests/organic-followthrough-live.test.mjs'),'Only the evidenced Public Alias runtime and bounded concurrency may change');
 const rootShare=content(MAIN_RELEASE_TIMEOUT_PAYLOAD,'release/root-share-preview-scope.mjs');assert.equal(occurrences(rootShare,"if(defaultReader){const actual=git('rev-parse','HEAD');if(contents(actual,CURRENT_MAIN_ROOT_SHARE_SCOPE).includes"),1,'Default root-share historical reads must enter the current-main projection exactly once');assert(rootShare.includes("assert.equal(timeoutFollowup.kind,'EXACT_PUBLIC_ALIAS_RUNTIME_CAP_REPAIR_20261022')")&&rootShare.includes("assert.equal(timeoutFollowup.base,'fc0baf8d2e41c577590531cb0fc9d178a6297b63')"),'The Public Alias repair must remain inside the exact current-main projection');
 const photoCalendar=content(MAIN_RELEASE_TIMEOUT_PAYLOAD,'release/photo-calendar-scope.mjs');assert.equal(occurrences(photoCalendar,'function originalCurrentMainRootShare(bytes){'),1,'The older photo-calendar inverse must compose the current-main root-share projection exactly once');assert.equal(occurrences(photoCalendar,' bytes=originalCurrentMainRootShare(bytes);'),1,'The current-main projection must be removed before the original photo-calendar inverse');

 assert.equal(readFileSync(MAIN_RELEASE_RECEIPT,'utf8').trimEnd(),content(actual,MAIN_RELEASE_RECEIPT).trimEnd(),'Working release-readiness receipt changed');
 assert.equal(git('rev-parse','HEAD'),actual,'Release-readiness HEAD moved');
 return Object.freeze({actual,predecessor:MAIN_RELEASE_BASE,payload:MAIN_RELEASE_PAYLOAD,followupPayload:MAIN_RELEASE_FOLLOWUP_PAYLOAD,timeoutPayload:MAIN_RELEASE_TIMEOUT_PAYLOAD,productionVerified:false});
}
