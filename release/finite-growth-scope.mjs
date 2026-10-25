import {memberConsentHistoricalView,memberConsentHistoricalFile} from './member-consent-repair-scope.mjs';
import assert from 'node:assert/strict';
import {immutableHistoryExecFileSync as execFileSync} from './immutable-git-facts.mjs';
export const FINITE_GROWTH_BASE='009b3a4a6f53a9545c73270ad1869e96f1e1a7d8';
export const FINITE_GROWTH_SOURCE='98b2c9237d5a37edf8cc7b0cde63fedd8de81ba0';
export const FINITE_GROWTH_APPROVED_SOURCE='221405a7344a5b2cdf30681d6620d2bd9a32855c';
export const FINITE_GROWTH_BLOBS=Object.freeze({
 'public-response-policy.mjs':'358b99341f9c6e84487274a8a03391778fdd954f',
 'public-seo-technical-data.mjs':'51f80040f796a09738e4aaa946132e72f87ce795',
 'public-tool-delivery.mjs':'63639e5a029b7641ea04e3d301e44dd660156da5',
 'shift-coach/worker.mjs':'e6a747aed4be3e6e29f2c4ff73b940ac89691e77',
 'tests/growth-finite-response-policy.test.mjs':'30d5e318946d0786299ee8b3bad75a40694ade52',
 'tests/public-seo-technical.test.mjs':'9c01686ead78934d003378969a1a384819c7dd79'
});
export const FINITE_GROWTH_PATHS=Object.freeze(Object.keys(FINITE_GROWTH_BLOBS));
export const FINITE_GROWTH_MAINTENANCE=Object.freeze([
 'release/finite-growth-scope.mjs','release/approved-runtime-composition.mjs',
 'release/my-treatment-compiled-scope.mjs','release/my-timber-progress-journey-scope.mjs',
 'tests/finite-growth-composition.test.mjs','tests/my-treatment-compiled-composition.test.mjs',
 '.github/workflows/shift-coach-integration.yml','obesity-awareness/rendered-live-proof.cjs'
]);
export const FINITE_GROWTH_FLAGS=Object.freeze(['publicBodyChanged','memberProductChanged','clinicalChanged','stockChanged','customerDataChanged','consentChanged','analyticsChanged','externalCommunicationsSent','paidModelEnabled','existingGatesWeakened','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened']);
const manifest='release/approved-runtime-composition.json',sorted=a=>[...a].sort();
const paths=new Set([...FINITE_GROWTH_PATHS,...FINITE_GROWTH_MAINTENANCE,manifest]);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const content=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8'});
export function verifyFiniteGrowth(c,{head,read,diff,ancestor,content:contents=content,blob=(ref,path)=>git('rev-parse',ref+':'+path)}){
 assert.equal(c?.proof,'EXACT_APPROVED_FINITE_GROWTH_20261013');
 assert.equal(c.base,FINITE_GROWTH_BASE);assert.equal(c.source,FINITE_GROWTH_SOURCE);assert.equal(c.approvedSource,FINITE_GROWTH_APPROVED_SOURCE);
 assert.equal(c.ownerApproval,'Matt: Do; 12 October 2026 19:50 BST');assert.equal(c.integrationIssue,1065);
 assert.deepEqual(c.paths,FINITE_GROWTH_PATHS);assert.deepEqual(c.maintenancePaths,FINITE_GROWTH_MAINTENANCE);
 assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);assert.match(head,/^[a-f0-9]{40}$/);
 for(const flag of FINITE_GROWTH_FLAGS)assert.equal(c[flag],false,'Finite growth authority boundary: '+flag);
 for(const ref of [c.base,c.source,c.maintenanceSource])ancestor(ref,head);
 ancestor(c.base,c.source);ancestor(c.source,c.maintenanceSource);
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(c.paths),'Unrelated approved growth payload');
 assert.deepEqual(sorted(diff(c.source,c.maintenanceSource)),sorted(c.maintenancePaths),'Unrelated finite growth maintenance');
 assert.deepEqual(diff(c.maintenanceSource,head),[manifest],'Unreviewed change after finite growth receipt');
 const prior=JSON.parse(contents(c.base,manifest)),current=JSON.parse(contents(head,manifest));
 delete current.finiteGrowthRepair;assert.deepEqual(current,prior,'Every existing release receipt must remain unchanged');
 // The caller's reader may return contents, blob IDs or test sentinels.
 // Pin real Git objects independently, then preserve its fresh-reader contract.
 for(const path of c.paths){assert.equal(blob(c.source,path),FINITE_GROWTH_BLOBS[path],'Exact approved growth blob changed: '+path);assert.equal(blob('HEAD',path),FINITE_GROWTH_BLOBS[path],'Approved growth source drift: '+path);assert.equal(read('HEAD',path),read(c.source,path),'Approved growth source drift: '+path);}
 for(const path of c.maintenancePaths)assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Finite growth maintenance source drift: '+path);
 const before=contents(c.base,'obesity-awareness/rendered-live-proof.cjs');
 const old="    assert((await page.locator('main').innerText()).includes('Increased'));";
 const replacement="    assert.match(await page.locator('main').innerText(), /\\bincreased\\b/i);";
 assert.equal(before.split(old).length,2,'Exactly one original risk-word assertion required');
 assert.equal(contents(head,'obesity-awareness/rendered-live-proof.cjs'),before.replace(old,replacement),'Retain every other obesity assertion and threshold');
 return c;
}
export function finiteGrowthHistoricalView(){
 const memberView=memberConsentHistoricalView(),record=memberView.record,rawHead=memberView.head,repair=record.finiteGrowthRepair;
 const read=memberView.read;
 if(repair)verifyFiniteGrowth(repair,{head:rawHead,read,blob:(ref,path)=>git('rev-parse',(ref==='HEAD'?memberView.head:ref)+':'+path),diff:(a,b)=>git('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>git('merge-base','--is-ancestor',a,b),content:memberView.content});
 const mappedRef=(ref,path)=>repair&&ref==='HEAD'&&paths.has(path)?repair.base:ref;
 const previousRecord=structuredClone(record);delete previousRecord.finiteGrowthRepair;
 return {record,previousRecord,rawHead,head:repair?repair.base:rawHead,read:(ref,path)=>read(mappedRef(ref,path),path),content:(ref,path)=>memberView.content(mappedRef(ref,path),path)};
}
export function finiteGrowthHistoricalFile(path,bytes){
 const original=memberConsentHistoricalFile(path,bytes);const view=finiteGrowthHistoricalView();assert.equal(original,content(view.rawHead,path),'Historical file must be verified earlier bytes');
 assert(FINITE_GROWTH_MAINTENANCE.includes(path),'Unlisted finite growth historical file');
 return view.record.finiteGrowthRepair?content(FINITE_GROWTH_BASE,path):original;
}
