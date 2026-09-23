import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync,appendFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

export const RELEASE_PATHS=new Set(['release/seo794-preservation.mjs','tests/seo794-preservation.test.mjs','scripts/verify-public-continuity-live.mjs','release/b1-runtime-only.json','scripts/b1-release-scope.mjs','tests/b1-release-scope.test.mjs','.github/workflows/cloudflare-production-promote.yml','.github/workflows/audit-repair-preview.yml','health-passport/production-release.mjs','.github/workflows/babylove-mounjaro-876303-live.yml','.github/workflows/babylove-repair.yml','public-promise-preservation.mjs','member-experience/public-preservation.mjs','member-experience/verify-production-member.mjs','tests/promise-accuracy.test.mjs','gate1-auth-security-source-gate.mjs','gate1-release-security-privacy-gate.mjs']);
export function validateScope(manifest,changed){
 assert.equal(manifest.mode,'runtime-only');
 assert.equal(manifest.grubPublication,undefined);
 if(manifest.approvedScope==='seo794'){
  assert.equal(manifest.applicationCommit,'f4052fff7670609f37e86f6324023cdf4baaea9a');
  assert.equal(manifest.baseCommit,'323f2409c0bd7f719abb05969fe9aeb2a827261b');
  assert.equal(manifest.previewEvidence.workflowRun,35873626050);
  assert.equal(manifest.previewEvidence.sha256,'891e09d329bc49182b65d95c67327b79460d77ca4c7c8604de1edecabe206828');
 }else{
  assert.equal(manifest.applicationCommit,'b0d765029047e9ec655038e1ab32fd9c7b1dbabe');
  assert.equal(manifest.baseCommit,'a14f759ab8653868c5ef210eff431bdf29bfa106');
 }
 const runtimeOnly=changed.every(p=>RELEASE_PATHS.has(p));
 if(manifest.enforceApplicationPin===true)assert.ok(runtimeOnly,'Application/source drift: review a new candidate and scope before release');
 return {runtimeOnly,applicationCommit:manifest.applicationCommit,baseCommit:manifest.baseCommit,releaseOnlyChanges:runtimeOnly?changed:[],applicationChanges:runtimeOnly?[]:changed};
}
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const dir='b1-runtime-release';
export function verifyScope(){
 assert.ok(existsSync('release/b1-runtime-only.json'),'Explicit release scope is required');
 const manifest=JSON.parse(readFileSync('release/b1-runtime-only.json'));
 // Verify ancestry as well as file equality: no alternate historic source.
 git('merge-base','--is-ancestor',manifest.baseCommit,manifest.applicationCommit);
 git('merge-base','--is-ancestor',manifest.applicationCommit,'HEAD');
 const changed=git('diff','--name-only',manifest.applicationCommit,'HEAD').split('\n').filter(Boolean);
 const report={...validateScope(manifest,changed),releaseCommit:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD^{tree}'),checkedAt:new Date().toISOString(),databaseMigrations:false,runtimeSchemaAdditions:manifest.runtimeSchemaAdditions||[],contentPublication:false};
 assert.equal(git('diff','--name-only'),'','Working source changed during release gates');
 mkdirSync(dir,{recursive:true});writeFileSync(dir+'/scope.json',JSON.stringify(report,null,2));
 if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,'runtime_only=true\ngrub_publication=false\n');
 return report;
}
const sha=value=>createHash('sha256').update(value).digest('hex');
export function assertPreserved(before,after){
 assert.deepEqual(after.tables,before.tables,'Protected medicine prices, stock or service records changed during release');
 assert.equal(after.configurationSha256,before.configurationSha256,'Production configuration changed');
}
async function snapshot(phase){
 assert.ok(['before','after'].includes(phase));verifyScope();
 assert.equal(process.env.GITHUB_REF,'refs/heads/main');
 const tables={};
 // Public catalogue/inventory only. No member, order, clinical or payment rows.
 for(const table of ['medicine_products','medicine_variants','medicine_inventory']){
  const sql=`SELECT * FROM ${table} ORDER BY ${table==='medicine_inventory'?'variant_id':'id'}`;
  const raw=JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command',sql],{encoding:'utf8',maxBuffer:8*1024*1024}));
  assert.ok(raw.length&&raw.every(r=>r.success),'Protected snapshot query failed');
  const rows=raw.flatMap(r=>r.results||[]);tables[table]={rows:rows.length,sha256:sha(JSON.stringify(rows))};
 }
 const report={phase,checkedAt:new Date().toISOString(),release:process.env.GITHUB_SHA,tables,configurationSha256:sha(readFileSync('wrangler.jsonc')),customerRecordsRead:false,productionWrites:0};
 writeFileSync(dir+'/'+phase+'.json',JSON.stringify(report,null,2));
 if(phase==='after')assertPreserved(JSON.parse(readFileSync(dir+'/before.json')),report);
 console.log(JSON.stringify(report));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{if(process.argv[2]==='--snapshot')await snapshot(process.argv[3]);else console.log(JSON.stringify(verifyScope()));}catch(error){console.error(error.message);process.exitCode=1;}
}
