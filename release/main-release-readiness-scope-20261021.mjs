import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
export const MAIN_RELEASE_BASE='39c703ac068b800bbf4a92a9277e21bd3d7b89e6';
export const MAIN_RELEASE_PAYLOAD='e85fe30291663f37d800009a9199620d6e2f1cb6';
export const MAIN_RELEASE_RECEIPT='release/main-release-readiness-scope-20261021.json';
export const MAIN_RELEASE_PATHS=Object.freeze([".github/workflows/programme-day-preview.yml","release/app-scope.mjs","reta-styles-data.mjs","wrangler.coaching.jsonc"]);
export const MAIN_RELEASE_MAINTENANCE=Object.freeze(["release/health-vision-scope-20261021.mjs","release/main-release-readiness-scope-20261021.mjs","tests/main-release-readiness-scope-20261021.test.mjs"]);
export const MAIN_LIVE_HEADER_CSS_SHA256='74b8c12bc157dfab638bb1202a3358d12b6a47bd5932c5df5480a1c887a3ef6d';
const expected={"kind":"EXACT_CURRENT_MAIN_RELEASE_READINESS_REPAIR_20261021","base":"39c703ac068b800bbf4a92a9277e21bd3d7b89e6","payload":"e85fe30291663f37d800009a9199620d6e2f1cb6","paths":[".github/workflows/programme-day-preview.yml","release/app-scope.mjs","reta-styles-data.mjs","wrangler.coaching.jsonc"],"maintenancePaths":["release/health-vision-scope-20261021.mjs","release/main-release-readiness-scope-20261021.mjs","tests/main-release-readiness-scope-20261021.test.mjs"],"observedFailures":{"production":{"run":39650793172,"job":119398602832,"source":"39c703ac068b800bbf4a92a9277e21bd3d7b89e6","deploymentPerformed":false,"failedBeforeMutation":true,"failures":["unadmitted Health extension in app scope","stale wrangler.coaching.jsonc fixture","live header-navigation-v2.css bytes absent from current source"]},"programme":{"run":39626334852,"job":119312440952,"reason":"maximum execution time 6h0m0s after 594 passing assertions and zero observed failures"}},"repair":{"appAdmission":"Health and this exact repair are admitted only after their independent immutable verifiers pass","coachingFixture":"wrangler.coaching.jsonc is byte-identical to unchanged wrangler.jsonc","publicCss":"header-navigation-v2 source is reconciled to the already-active live bytes","activeHeaderCssSha256":"74b8c12bc157dfab638bb1202a3358d12b6a47bd5932c5df5480a1c887a3ef6d","programmeSourceTestConcurrency":2,"workflowTaskConcurrency":2,"sourceTestFilesChanged":false,"sourceTestSelectionChanged":false,"sourceAssertionsRemoved":0,"memberRuntimeChanged":false,"homepageBodyChanged":false,"clinicalSafetyChanged":false,"privacyOrConsentChanged":false,"memberRecordsChanged":false,"stockChanged":false,"commercialSettingsChanged":false},"authority":{"myTimberDeploymentApproved":true,"publicHomepageChangeApproved":false,"clinicalActivationApproved":false,"unrelatedChangesApproved":false},"productionVerified":false};
const git=(...args)=>execFileSync('git',['--no-replace-objects',...args],{encoding:'utf8',maxBuffer:64e6}).trimEnd();
const content=(ref,path)=>execFileSync('git',['--no-replace-objects','show',ref+':'+path],{encoding:'utf8',maxBuffer:64e6});
const changed=(a,b)=>git('diff','--no-renames','--name-only',a,b).split('\n').filter(Boolean);
const sorted=xs=>[...xs].sort(),sha=value=>createHash('sha256').update(value).digest('hex');
function reta(ref){const source=content(ref,'reta-styles-data.mjs'),prefix='export const RETA_STYLES=';assert(source.startsWith(prefix)&&source.endsWith(';\n'),'Exact RETA source envelope required');return JSON.parse(source.slice(prefix.length,-2));}
export function verifyMainReleaseReadinessExtension(){
 const actual=git('rev-parse','HEAD');
 assert.equal(git('diff','--name-only','HEAD','--'),'','Release-readiness tracked source changed');
 assert.equal(git('diff','--cached','--name-only','--'),'','Release-readiness staged source changed');
 assert.equal(git('for-each-ref','--format=%(refname)','refs/replace'),'','Release-readiness replacement history forbidden');
 for(const row of git('ls-files','-v','-z').split('\0').filter(Boolean))assert(row.startsWith('H '),'Release-readiness hidden source forbidden');
 const c=JSON.parse(git('show',actual+':'+MAIN_RELEASE_RECEIPT)),{maintenanceSource,...record}=c;
 assert.deepEqual(record,expected,'Only the exact current-main release-readiness repair is authorised');
 assert.match(maintenanceSource,/^[a-f0-9]{40}$/);
 for(const [a,b,list] of [[MAIN_RELEASE_BASE,MAIN_RELEASE_PAYLOAD,MAIN_RELEASE_PATHS],[MAIN_RELEASE_PAYLOAD,maintenanceSource,MAIN_RELEASE_MAINTENANCE],[maintenanceSource,actual,[MAIN_RELEASE_RECEIPT]]]){
  git('merge-base','--is-ancestor',a,b);assert.deepEqual(sorted(changed(a,b)),sorted(list),'Exact release-readiness increment required');
 }
 assert.deepEqual(sorted(changed(MAIN_RELEASE_BASE,actual)),sorted([...MAIN_RELEASE_PATHS,...MAIN_RELEASE_MAINTENANCE,MAIN_RELEASE_RECEIPT]),'Unrelated release-readiness change rejected');
 for(const [ref,list] of [[MAIN_RELEASE_PAYLOAD,MAIN_RELEASE_PATHS],[maintenanceSource,MAIN_RELEASE_MAINTENANCE]])for(const path of list){
  assert.equal(git('rev-parse',actual+':'+path),git('rev-parse',ref+':'+path),'Pinned release-readiness bytes changed: '+path);
  assert(git('ls-tree',actual,'--',path).startsWith('100644 blob '),'Regular release-readiness source required: '+path);
 }
 assert.equal(git('rev-parse',actual+':release/approved-runtime-composition.json'),git('rev-parse',MAIN_RELEASE_BASE+':release/approved-runtime-composition.json'),'Previous approval ledger changed');
 assert.equal(git('rev-parse',actual+':wrangler.jsonc'),git('rev-parse',MAIN_RELEASE_BASE+':wrangler.jsonc'),'Production configuration changed');
 assert.equal(content(MAIN_RELEASE_PAYLOAD,'wrangler.coaching.jsonc'),content(MAIN_RELEASE_PAYLOAD,'wrangler.jsonc'),'Coaching fixture must equal unchanged production configuration');
 const beforeWorkflow=content(MAIN_RELEASE_BASE,'.github/workflows/programme-day-preview.yml'),afterWorkflow=content(MAIN_RELEASE_PAYLOAD,'.github/workflows/programme-day-preview.yml');
 assert.equal((beforeWorkflow.match(/--test-concurrency=1/g)||[]).length,1);assert.equal(afterWorkflow,beforeWorkflow.replace('--test-concurrency=1','--test-concurrency=2'),'Only bounded Programme file scheduling may change');
 const before=reta(MAIN_RELEASE_BASE),after=reta(MAIN_RELEASE_PAYLOAD),key='/assets/header-navigation-v2.css';
 assert.deepEqual(Object.keys(after),Object.keys(before));for(const name of Object.keys(before))if(name!==key)assert.equal(after[name],before[name],'Unrelated public CSS changed: '+name);
 assert(after[key].startsWith(before[key]));assert.equal(after[key].slice(before[key].length),'\n/* Header logo: one self-contained brand asset, with its original proportions. */\nhtml body header.site-header[data-header-v2][data-header-style] .header-inner{height:100%!important;min-height:0!important;align-items:center!important}\nhtml body header.site-header[data-header-v2][data-header-style] .site-logo{display:flex!important;align-items:center!important;line-height:0!important}\nhtml body header.site-header[data-header-v2][data-header-style] .site-logo img{display:block!important;margin:0!important;content:url("/assets/header-logo-20261020-v2.svg")!important;clip-path:none!important;filter:none!important;object-fit:contain!important;object-position:center!important}\nhtml body header.site-header[data-header-v2][data-header-style] .site-logo::after{content:none!important;display:none!important}\n');
 assert.equal(sha(after[key]),MAIN_LIVE_HEADER_CSS_SHA256,'Header CSS must equal retained active live bytes');
 assert.equal(readFileSync(MAIN_RELEASE_RECEIPT,'utf8').trimEnd(),git('show',actual+':'+MAIN_RELEASE_RECEIPT),'Working release-readiness receipt changed');
 assert.equal(git('rev-parse','HEAD'),actual,'Release-readiness HEAD moved');
 return Object.freeze({actual,predecessor:MAIN_RELEASE_BASE,payload:MAIN_RELEASE_PAYLOAD,productionVerified:false});
}
