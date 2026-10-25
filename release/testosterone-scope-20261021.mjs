import {createRequire} from 'node:module';
import {verifyHealthVisionExtension} from './health-vision-scope-20261021.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
export const TRT_BASE='a78f893a30d41e4542dfd53c08dcdb77f88090e4';
export const TRT_PAYLOAD='77eb4af2334f747ab91a2958f3d59875e8e4e4f4';
export const TRT_RECEIPT='release/testosterone-scope-20261021.json';
export const TRT_PATHS=Object.freeze(['public-shell-contract.mjs','shift-health-public.mjs','testosterone-guides.mjs','testosterone-public-content.mjs','tests/public-audit-repair.test.mjs','tests/testosterone-guides.test.mjs','tests/testosterone-public.test.mjs']);
export const TRT_MAINTENANCE=Object.freeze(['docs/testosterone-expansion-20261021.md','release/testosterone-scope-20261021.mjs','release/website-editorial-scope-20261018.mjs','tests/testosterone-release-scope.test.mjs']);
const git=(...args)=>execFileSync('git',['--no-replace-objects',...args],{encoding:'utf8',maxBuffer:64e6}).trimEnd();
const sorted=xs=>[...xs].sort();
const changed=(a,b)=>git('diff','--no-renames','--name-only',a,b).split('\n').filter(Boolean);
export function verifyTestosteroneExtension(){
 const {approvedNewsTickerOuterFrame,withApprovedTickerPredecessor,approvedTickerPredecessorHead,approvedTickerActualHead}=createRequire(import.meta.url)('./approved-news-ticker-frame-20261024.mjs');
 const ticker=approvedTickerPredecessorHead()?null:approvedNewsTickerOuterFrame();
 if(ticker){const result=withApprovedTickerPredecessor(ticker,()=>verifyTestosteroneExtension());return Object.freeze({...result,actual:ticker.rawHead});}
 const extension=verifyHealthVisionExtension();
 const actual=approvedTickerPredecessorHead()??git('rev-parse','HEAD'),snapshot=extension.predecessor;
 assert.equal(extension.actual,actual,'Health actual HEAD required');
 assert.equal(git('diff','--name-only','HEAD','--'),'','TRT tracked source changed');
 assert.equal(git('diff','--cached','--name-only','--'),'','TRT staged source changed');
 assert.equal(git('for-each-ref','--format=%(refname)','refs/replace'),'','TRT replacement history forbidden');
 for(const row of git('ls-files','-v','-z').split('\0').filter(Boolean))assert(row.startsWith('H '),'TRT hidden source forbidden');
 const c=JSON.parse(git('show',snapshot+':'+TRT_RECEIPT));
 const {maintenanceSource,...fixed}=c;
 assert.deepEqual(fixed,{kind:'EXACT_TRT_INFORMATIONAL_EXTENSION_20261021',base:TRT_BASE,payload:TRT_PAYLOAD,paths:[...TRT_PATHS],maintenancePaths:[...TRT_MAINTENANCE],authority:{scopeRegistrationApproved:true,publicationApproved:true,homepageApproved:false,clinicalActivationApproved:false,unrelatedChangesApproved:false},productionVerified:false});
 assert.match(maintenanceSource,/^[a-f0-9]{40}$/);
 for(const [a,b,paths] of [[TRT_BASE,TRT_PAYLOAD,TRT_PATHS],[TRT_PAYLOAD,maintenanceSource,TRT_MAINTENANCE],[maintenanceSource,snapshot,[TRT_RECEIPT]]]){
  git('merge-base','--is-ancestor',a,b);
  assert.deepEqual(sorted(changed(a,b)),sorted(paths),'TRT exact increment required');
 }
 assert.deepEqual(sorted(changed(TRT_BASE,snapshot)),sorted([...TRT_PATHS,...TRT_MAINTENANCE,TRT_RECEIPT]),'TRT unrelated change rejected');
 for(const [ref,paths] of [[TRT_PAYLOAD,TRT_PATHS],[maintenanceSource,TRT_MAINTENANCE]]){
  for(const p of paths){
   assert.equal(git('rev-parse',snapshot+':'+p),git('rev-parse',ref+':'+p),'TRT pinned bytes changed: '+p);
   assert(git('ls-tree',snapshot,'--',p).startsWith('100644 blob '),'TRT regular source file required');
  }
 }
 assert.equal(git('rev-parse',snapshot+':release/approved-runtime-composition.json'),git('rev-parse',TRT_BASE+':release/approved-runtime-composition.json'),'TRT previous approvals changed');
 assert.equal(readFileSync(TRT_RECEIPT,'utf8').trimEnd(),git('show',snapshot+':'+TRT_RECEIPT),'TRT working receipt changed');
 assert.equal(git('rev-parse','HEAD'),approvedTickerActualHead()??actual,'TRT HEAD moved');
 return Object.freeze({actual,predecessor:TRT_BASE,payload:TRT_PAYLOAD,productionVerified:false});
}
