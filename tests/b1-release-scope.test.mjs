import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateScope,assertPreserved,RELEASE_PATHS} from '../scripts/b1-release-scope.mjs';
const manifest=JSON.parse(readFileSync(new URL('../release/b1-runtime-only.json',import.meta.url)));
const workflow=readFileSync(new URL('../.github/workflows/cloudflare-production-promote.yml',import.meta.url),'utf8');
const steps=workflow.split(/\n      - /);
test('exact preview application plus only reviewed release plumbing is accepted',()=>{assert.equal(validateScope(manifest,[...RELEASE_PATHS]).runtimeOnly,true)});
test('application changes leave B1 runtime-only mode while malformed B1 authority still fails closed',()=>{
 for(const path of ['worker-entry-v6.js','wrangler.jsonc','migrations/019_foundayo_option_stock_lock.sql','.github/workflows/unknown.yml','auth-recovery-v1.js']){const result=validateScope(manifest,[path]);assert.equal(result.runtimeOnly,false);assert.deepEqual(result.applicationChanges,[path]);}
 for(const patch of [{mode:'full'},{applicationCommit:'f'.repeat(40)},{baseCommit:'f'.repeat(40)}])assert.throws(()=>validateScope({...manifest,...patch},[]));
});
test('every legacy publication, seed and migration step is unreachable for runtime-only release',()=>{
 const mutations=['Apply pharmacy-readiness database additions','Initialise Medicines Watch source observations','Seed recent discovery snapshots without publishing or sending notifications','Prepare additive daily check-in feedback store','Publish the exact owner-approved illustrated Wegovy guide','Publish the reconciled oral semaglutide guide','Publish only the fixed owner-authorised catalogue when approved','Publish the exact owner-authorised newsroom batch when approved'];
 for(const name of mutations){const step=steps.find(s=>s.startsWith('name: '+name+'\n'));assert.ok(step,name);assert.match(step,/if: steps\.scope\.outputs\.runtime_only != 'true'/,name)}
 const passport=steps.find(s=>s.startsWith('name: Prepare exact additive Passport schema and rollback'));
 assert.match(passport,/PASSPORT_SCHEMA_READ_ONLY: \$\{\{ steps.scope.outputs.runtime_only \}\}/);
 const source=readFileSync(new URL('../health-passport/production-release.mjs',import.meta.url),'utf8');
 assert.ok(source.indexOf("if(process.env.PASSPORT_SCHEMA_READ_ONLY==='true')assertSchema(existing,source)")<source.indexOf("if(!existing.length)cli("));
});
test('gates, fresh source check, rollback capture and exactly one deploy remain ordered',()=>{
 const scope=workflow.indexOf('id: scope'),deploy=workflow.indexOf('npx wrangler deploy --config wrangler.jsonc');
 assert.equal(workflow.match(/npx wrangler deploy --config wrangler.jsonc/g)?.length,1);
 for(const gate of ['Verify exact current main before production mutations','Verify security-check timeouts and retry before promotion','Capture current Worker deployment for rollback','Capture protected catalogue and stock without customer records']){const index=workflow.indexOf('name: '+gate);assert.ok(index>scope&&index<deploy,gate)}
 assert.match(workflow,/node scripts\/b1-release-scope.mjs\n          node scripts\/catalogue-publication-client.mjs --verify-main\n          npx wrangler deploy/);
 assert.ok(workflow.indexOf('Verify B1 protected catalogue and stock remain identical')>deploy);
 for(const step of steps.filter(s=>/name: (Verify|Prove|Block) /.test(s)))assert.ok(!step.includes("runtime_only != 'true'"),'Verification must not be skipped: '+step.split('\n')[0]);
});
test('protected price/stock/config mismatch fails rather than reporting success',()=>{
 const before={tables:{medicine_products:{rows:1,sha256:'a'},medicine_variants:{rows:2,sha256:'b'},medicine_inventory:{rows:2,sha256:'c'}},configurationSha256:'d'};
 assert.doesNotThrow(()=>assertPreserved(before,structuredClone(before)));
 for(const table of Object.keys(before.tables)){const changed=structuredClone(before);changed.tables[table].sha256='changed';assert.throws(()=>assertPreserved(before,changed),/changed/)}
 assert.throws(()=>assertPreserved(before,{...before,configurationSha256:'changed'}),/configuration/);
});
