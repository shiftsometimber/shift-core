import {MAIN_RELEASE_BASE,verifyMainReleaseReadinessExtension} from './main-release-readiness-scope-20261021.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
export const HEALTH_BASE='cfac31c6dabafed3d48d9e18a9d0ad527e6ce8db';
export const HEALTH_PAYLOAD='164ee30d70a7da6925f1eed3604252831295bf8e';
export const HEALTH_RECEIPT='release/health-vision-scope-20261021.json';
export const HEALTH_PATHS=Object.freeze(['release/shift-health-vision-20261021/STATUS.json','release/shift-health-vision-20261021/checks.json','release/shift-health-vision-20261021/health-vision-preservation.json','release/shift-health-vision-20261021/live-status-latest.json','release/shift-health-vision-20261021/production-bundle-final.log','release/shift-health-vision-20261021/source-tests-final.log','shift-health-public.mjs','shift-health-vision-content.mjs','tests/testosterone-guides.test.mjs']);
export const HEALTH_MAINTENANCE=Object.freeze(['release/health-vision-scope-20261021.mjs','release/testosterone-scope-20261021.mjs','release/website-editorial-scope-20261018.mjs','tests/health-vision-scope-20261021.test.mjs']);
const git=(...args)=>execFileSync('git',['--no-replace-objects',...args],{encoding:'utf8',maxBuffer:64e6}).trimEnd();
const sorted=x=>[...x].sort(),changed=(a,b)=>git('diff','--no-renames','--name-only',a,b).split('\n').filter(Boolean);
export function verifyHealthVisionExtension(){
 const extension=verifyMainReleaseReadinessExtension();
 const actual=git('rev-parse','HEAD'),snapshot=extension.predecessor;
 assert.equal(extension.actual,actual,'Release-readiness actual HEAD required');assert.equal(snapshot,MAIN_RELEASE_BASE,'Exact release-readiness predecessor required');
 assert.equal(git('diff','--name-only','HEAD','--'),'','Health tracked source changed');
 assert.equal(git('diff','--cached','--name-only','--'),'','Health staged source changed');
 assert.equal(git('for-each-ref','--format=%(refname)','refs/replace'),'','Health replacement history forbidden');
 for(const row of git('ls-files','-v','-z').split('\0').filter(Boolean))assert(row.startsWith('H '),'Health hidden source forbidden');
 const c=JSON.parse(git('show',snapshot+':'+HEALTH_RECEIPT)),{maintenanceSource,...fixed}=c;
 assert.deepEqual(fixed,{kind:'EXACT_APPROVED_HEALTH_HUB_PRESENTATION_20261021',base:HEALTH_BASE,payload:HEALTH_PAYLOAD,paths:[...HEALTH_PATHS],maintenancePaths:[...HEALTH_MAINTENANCE],authority:{publicationApproved:true,homepageApproved:false,clinicalActivationApproved:false,unrelatedChangesApproved:false},productionVerified:false});
 assert.match(maintenanceSource,/^[a-f0-9]{40}$/);
 for(const [a,b,paths] of [[HEALTH_BASE,HEALTH_PAYLOAD,HEALTH_PATHS],[HEALTH_PAYLOAD,maintenanceSource,HEALTH_MAINTENANCE],[maintenanceSource,snapshot,[HEALTH_RECEIPT]]]){git('merge-base','--is-ancestor',a,b);assert.deepEqual(sorted(changed(a,b)),sorted(paths),'Health exact increment required');}
 assert.deepEqual(sorted(changed(HEALTH_BASE,snapshot)),sorted([...HEALTH_PATHS,...HEALTH_MAINTENANCE,HEALTH_RECEIPT]),'Health unrelated change rejected');
 for(const [ref,paths] of [[HEALTH_PAYLOAD,HEALTH_PATHS],[maintenanceSource,HEALTH_MAINTENANCE]])for(const p of paths){assert.equal(git('rev-parse',snapshot+':'+p),git('rev-parse',ref+':'+p),'Health pinned bytes changed: '+p);assert(git('ls-tree',snapshot,'--',p).startsWith('100644 blob '),'Health regular source file required');}
 assert.equal(git('rev-parse',snapshot+':release/approved-runtime-composition.json'),git('rev-parse',HEALTH_BASE+':release/approved-runtime-composition.json'),'Health previous approvals changed');
 assert.equal(readFileSync(HEALTH_RECEIPT,'utf8').trimEnd(),git('show',snapshot+':'+HEALTH_RECEIPT),'Health working receipt changed');
 verifyMainReleaseReadinessExtension();assert.equal(git('rev-parse','HEAD'),actual,'Health HEAD moved');
 return Object.freeze({actual,predecessor:HEALTH_BASE,payload:HEALTH_PAYLOAD,productionVerified:false});
}
