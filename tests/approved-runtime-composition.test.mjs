import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyComposedRuntime,COMPOSITION_BASE,COMPOSITION_SOURCE,COMPOSITION_PATHS} from '../release/approved-runtime-composition.mjs';
const fixture=()=>({head:COMPOSITION_SOURCE,ancestor:()=>{},diff:(a,b)=>a===COMPOSITION_BASE&&b===COMPOSITION_SOURCE?[...COMPOSITION_PATHS]:[],read:()=> 'same'});
test('exact independently approved source composition passes',()=>assert.equal(verifyComposedRuntime(fixture()).paths,36));
test('every approved path remains byte-pinned',()=>{
 for(const path of COMPOSITION_PATHS){const f=fixture();f.head='a'.repeat(40);f.read=(ref,p)=>ref===f.head&&p===path?'drift':'same';assert.throws(()=>verifyComposedRuntime(f),/source drift/);}
});
test('privacy, runtime binding, SEO payload and deploy workflow remain protected',()=>{
 for(const path of ['wrangler.jsonc','package.json','package-lock.json','.github/workflows/cloudflare-production-promote.yml','acquisition-activation/consent.mjs','activation-measurement/assets.mjs','shift-coach/worker.mjs','shift-coach/release-manifest.json','public-seo-context.mjs','public-seo-organic-links.mjs','public-seo-organic-link-data.mjs']){
 const f=fixture();f.head='a'.repeat(40);f.read=(ref,p)=>ref===f.head&&p===path?'drift':'same';assert.throws(()=>verifyComposedRuntime(f),/boundary drift/);}
});
test('an unknown later file is rejected rather than silently whitelisted',()=>{
 const f=fixture();f.diff=(a,b)=>a===COMPOSITION_BASE?[...COMPOSITION_PATHS]:['checkout.mjs'];assert.throws(()=>verifyComposedRuntime(f),/Unreviewed changes/);
});
test('missing or extra composition files are rejected',()=>{
 for(const paths of [COMPOSITION_PATHS.slice(1),[...COMPOSITION_PATHS,'checkout.mjs']]){const f=fixture();f.diff=(a,b)=>a===COMPOSITION_BASE?paths:[];assert.throws(()=>verifyComposedRuntime(f),/Unreviewed composition path/);}
});
test('all source commits must be ancestors of the actual head',()=>{
 const f=fixture();f.ancestor=()=>{throw Error('Not an ancestor');};assert.throws(()=>verifyComposedRuntime(f),/Not an ancestor/);
});
test('invalid head identifiers are rejected',()=>assert.throws(()=>verifyComposedRuntime({...fixture(),head:'HEAD'})));
test('captured repository source passes a real independent Git check',()=>assert.equal(verifyComposedRuntime({head:COMPOSITION_SOURCE}).source,COMPOSITION_SOURCE));

import {verifyReconciledRelease,reconciliationHistoricalRead,reconciliationRecord,RECONCILIATION_MAINTENANCE} from '../release/approved-runtime-composition.mjs';
test('actual composed release and its finite maintenance receipt pass',()=>assert(verifyReconciledRelease()));
test('fresh supplied readers cannot conceal payload or maintenance drift',()=>{for(const path of [...COMPOSITION_PATHS,...RECONCILIATION_MAINTENANCE])assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'drift':'same'),/source.*drift/);});
test('historical reader maps only checked existing composition paths',()=>{const read=reconciliationHistoricalRead((ref,p)=>ref);assert.equal(read('HEAD','worker-entry-v6.js'),COMPOSITION_BASE);assert.equal(read('HEAD','acquisition-activation/consent.mjs'),'HEAD');assert.equal(read('HEAD','public-seo-organic-links.mjs'),'HEAD');});
test('a fresh malicious reader is rechecked after a successful reader',()=>{reconciliationHistoricalRead((ref,p)=>'same',true);assert.throws(()=>reconciliationHistoricalRead((ref,p)=>ref==='HEAD'&&p==='worker-entry-v6.js'?'drift':'same',true),/drift/);});

import {reconciliationChangedPath,RECONCILIATION_MANIFEST} from '../release/approved-runtime-composition.mjs';
test('approved composition rejects deletion, rename and type changes for every path',()=>{
 for(const path of [...COMPOSITION_PATHS,...RECONCILIATION_MAINTENANCE,RECONCILIATION_MANIFEST])for(const status of ['D','R','R100','T','C'])assert.throws(()=>reconciliationChangedPath(status,path),/Unexpected approved composition file status/);
 assert.equal(reconciliationChangedPath('M','unreviewed.mjs'),false);
 for(const status of ['A','M'])assert.equal(reconciliationChangedPath(status,'release/seo-growth-scope.mjs'),true);
 assert.equal(reconciliationChangedPath('M','worker-entry-v6.js'),true);
 assert.throws(()=>reconciliationChangedPath('A','worker-entry-v6.js'),/Unexpected/);
 assert.equal(reconciliationChangedPath('A',RECONCILIATION_MANIFEST),true);
 assert.throws(()=>reconciliationChangedPath('M',RECONCILIATION_MANIFEST),/Unexpected/);
});

import {assertProductionProofBudget} from '../release/approved-runtime-composition.mjs';
test('production time budget cannot change commands, permissions, gates or rollback',()=>{
 const before='jobs:\n  promote:\n    timeout-minutes: 25\n    env:\n      CLOUDFLARE_ACCOUNT_ID: same\n    steps:\n      - run: original-guard\n      - run: original-rollback\n';
 const current=before.replace('timeout-minutes: 25','timeout-minutes: 60');
 assert.doesNotThrow(()=>assertProductionProofBudget(before,current));
 for(const bad of [current.replace('original-guard','skip-guard'),current.replace('original-rollback',''),current+'permissions: write-all\n',current.replace('timeout-minutes: 60','timeout-minutes: 120')])assert.throws(()=>assertProductionProofBudget(before,bad));
 assert.throws(()=>assertProductionProofBudget(before.replace('timeout-minutes: 25','timeout-minutes: 30'),current));
});

test('warmed default immutable blob proof never caches a supplied reader',()=>{
 verifyReconciledRelease();verifyReconciledRelease();
 const visited=[];
 assert.throws(()=>verifyReconciledRelease((ref,path)=>{visited.push([ref,path]);return ref==='HEAD'&&path==='worker-entry-v6.js'?'changed':'same';}),/Approved composition source \/ boundary drift/);
 assert(visited.some(([ref,path])=>ref==='HEAD'&&path==='worker-entry-v6.js'));
});
