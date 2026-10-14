import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,mkdtempSync,writeFileSync,chmodSync,rmSync,renameSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {GP_CI_BOOTSTRAP_PATHS as ciPaths,GP_CI_BOOTSTRAP_WORKFLOWS as ciWorkflows,insertGpCiPrerequisite} from '../release/gp-ci-source-prerequisites-20261014.mjs';
import {GP_MEMBER_CODE_BASE as base,GP_MEMBER_CODE_SOURCE as source,GP_MEMBER_CODE_TREE as tree,GP_MEMBER_SAVED_SOURCE as savedSource,GP_MEMBER_SAVED_TREE as savedTree,GP_MEMBER_SOURCE_AUTHORITIES as sourceAuthorities,GP_MEMBER_CODE_BLOBS as blobs,GP_MEMBER_CODE_BUNDLE_BLOBS as bundleBlobs,GP_MEMBER_CODE_MAINTENANCE as maintenance,GP_MEMBER_CODE_RECORD_PATH as recordPath,GP_MEMBER_CODE_AUTHORITY as authority,GP_MEMBER_FRONTEND_BASE as hqBase,GP_MEMBER_FRONTEND_SOURCE as hqSource,GP_MEMBER_FRONTEND_TREE as hqTree,GP_MEMBER_FRONTEND_BLOBS as hqBlobs,GP_MEMBER_FRONTEND_ASSET_PATH as hqAssetPath,GP_MEMBER_FRONTEND_ASSET_BASE_BLOB as hqAssetBaseBlob,GP_MEMBER_FRONTEND_ASSET_BLOB as hqAssetBlob,GP_MEMBER_FRONTEND_ASSET_SUFFIX as hqAssetSuffix,verifyGpMemberCodeFacts,verifyGpMemberFrontendFacts,verifyGpMemberCodeAdmission,gpMemberCodeChangedPaths,gpMemberCodeCleanSource} from '../release/gp-member-code-admission-20261014.mjs';
const head='1'.repeat(40),payload='2'.repeat(40),maint='3'.repeat(40),paths=Object.keys(blobs).sort();
function fixture(){
 const c={proof:'EXACT_A021_GP_MEMBER_CODE_20261014',base,originalSource:source,originalTree:tree,savedProfileSource:savedSource,savedProfileTree:savedTree,sourceAuthorities:structuredClone(sourceAuthorities),payloadSource:payload,maintenanceSource:maint,paths,maintenancePaths:maintenance,authority:structuredClone(authority)};
 const ciBefore=p=>'name: Synthetic source-fact fixture\n'+ciWorkflows[p].anchor;
 const f={head,headNow:()=>head,clean:()=>{},tree:r=>{assert([source,savedSource].includes(r));return r===source?tree:savedTree;},blob:(r,p)=>ciWorkflows[p]?(r===base?ciWorkflows[p].blob:'wired:'+p):blobs[p]||bundleBlobs[p]||'preserved:'+p,mode:()=> '100644',content:(r,p)=>p===recordPath?JSON.stringify(c):ciWorkflows[p]?(r===base?ciBefore(p):insertGpCiPrerequisite(p,ciBefore(p))):'{}',ancestor:()=>true,diff:(a,b)=>a===base&&b===payload?paths:a===payload&&b===maint?maintenance:a===maint&&b===head?[recordPath]:a===base&&b===head?[...paths,...maintenance,recordPath]:[]};
 return {c,f};
}
test('exact A021 source and untouched release/flags are accepted',()=>{const {c,f}=fixture();assert.equal(verifyGpMemberCodeFacts(c,f),c);});
test('broad or invented registration fields fail',()=>{const {c,f}=fixture();c.approvedEverything=true;assert.throws(()=>verifyGpMemberCodeFacts(c,f),/registration fields/);});
test('email authority cannot be smuggled into GP scope',()=>{const {c,f}=fixture();c.authority.emailAuthority=true;assert.throws(()=>verifyGpMemberCodeFacts(c,f));});
test('a different accepted base needs a newly frozen bounded policy',()=>{const {c,f}=fixture();c.base='4'.repeat(40);assert.throws(()=>verifyGpMemberCodeFacts(c,f));});
test('original private packet source is pinned independently',()=>{const {c,f}=fixture();c.originalSource='5'.repeat(40);assert.throws(()=>verifyGpMemberCodeFacts(c,f));});
test('changed original GP object is rejected',()=>{const {c,f}=fixture(),blob=f.blob;f.blob=(r,p)=>r===source&&p==='gp-directory/hq-member-gp.mjs'?'changed':blob(r,p);assert.throws(()=>verifyGpMemberCodeFacts(c,f),/Original GP/);});
test('saved profile code uses its own exact original object',()=>{const {c,f}=fixture(),blob=f.blob;f.blob=(r,p)=>r===savedSource&&p==='gp-directory/client.mjs'?'changed':blob(r,p);assert.throws(()=>verifyGpMemberCodeFacts(c,f),/Original GP/);});
test('A011 cannot silently inherit or replace A021 authority',()=>{const {c,f}=fixture();c.sourceAuthorities.A011.source=source;assert.throws(()=>verifyGpMemberCodeFacts(c,f),/remain distinct/);});
test('including either original0ae configuration path is forbidden',()=>{const {c,f}=fixture();c.paths=[...c.paths,'wrangler.hq-management.jsonc'].sort();assert.throws(()=>verifyGpMemberCodeFacts(c,f));});
test('locally altered GP implementation is rejected',()=>{const {c,f}=fixture(),blob=f.blob;f.blob=(r,p)=>r===head&&p===paths[0]?'changed':blob(r,p);assert.throws(()=>verifyGpMemberCodeFacts(c,f),/Current GP/);});
test('unchanged allowed GP bytes cannot conceal symlink/executable mode drift',()=>{const {c,f}=fixture();f.mode=(r,p)=>r===head&&p===paths[0]?'120000':'100644';assert.throws(()=>verifyGpMemberCodeFacts(c,f),/file mode/);});
test('unrelated source changes fail the full diff boundary',()=>{const {c,f}=fixture(),diff=f.diff;f.diff=(a,b)=>a===base&&b===head?[...diff(a,b),'package.json']:diff(a,b);assert.throws(()=>verifyGpMemberCodeFacts(c,f),/unrelated path/);});
test('maintenance cannot rewrite an existing source controller',()=>{const {c,f}=fixture(),diff=f.diff;f.diff=(a,b)=>a===payload&&b===maint?[...diff(a,b),'release/approved-runtime-composition.mjs']:diff(a,b);assert.throws(()=>verifyGpMemberCodeFacts(c,f),/source boundary/);});
test('a GP flag cannot be enabled during code admission',()=>{const {c,f}=fixture(),content=f.content;f.content=(r,p)=>p==='wrangler.jsonc'?'"MEMBER_GP_DIRECTORY_V2_ENABLED": "true"':content(r,p);assert.throws(()=>verifyGpMemberCodeFacts(c,f),/remain OFF/);});
test('current tracked dirt is checked both before and after proof',()=>{const {c,f}=fixture();let n=0;f.clean=()=>{if(++n===2)throw Error('exit dirty');};assert.throws(()=>verifyGpMemberCodeFacts(c,f),/exit dirty/);assert.equal(n,2);});
test('source HEAD movement during proof is rejected',()=>{const {c,f}=fixture();f.headNow=()=>payload;assert.throws(()=>verifyGpMemberCodeFacts(c,f),/HEAD changed/);});
test('source packet maintenance cannot substitute different original bundle bytes',()=>{const {c,f}=fixture(),blob=f.blob,path=Object.keys(bundleBlobs)[0];f.blob=(r,p)=>p===path?'changed bundle':blob(r,p);assert.throws(()=>verifyGpMemberCodeFacts(c,f),/original GP source bundle/);});
test('source packet maintenance cannot change original bundle file modes',()=>{const {c,f}=fixture(),path=Object.keys(bundleBlobs)[0];f.mode=(r,p)=>p===path?'100755':'100644';assert.throws(()=>verifyGpMemberCodeFacts(c,f),/bundle file mode/);});
test('CI bootstrap cannot adopt workflow bytes from a different accepted baseline',()=>{const {c,f}=fixture(),blob=f.blob;f.blob=(r,p)=>r===base&&p===ciPaths[0]?'different baseline':blob(r,p);assert.throws(()=>verifyGpMemberCodeFacts(c,f),/accepted-week CI workflow baseline/);});
test('CI bootstrap retains every original workflow byte and assertion',()=>{const {c,f}=fixture(),content=f.content;f.content=(r,p)=>content(r,p)+(r===head&&p===ciPaths[0]?'# foreign source mutation\n':'');assert.throws(()=>verifyGpMemberCodeFacts(c,f),/Every original workflow byte/);});
test('CI bootstrap cannot alter workflow executable modes',()=>{const {c,f}=fixture();f.mode=(r,p)=>r===head&&p===ciPaths[0]?'100755':'100644';assert.throws(()=>verifyGpMemberCodeFacts(c,f),/CI workflow file mode/);});
function hqFixture(){const assets='*\n!index.html\n!hq.js\n';return {head,headNow:()=>head,clean:()=>{},tree:r=>{assert.equal(r,hqSource);return hqTree;},ancestor:(a,b)=>{assert.equal(a,hqBase);assert.equal(b,head);return true;},diff:()=>[...Object.keys(hqBlobs),hqAssetPath],blob:(r,p)=>p===hqAssetPath?(r===head?hqAssetBlob:hqAssetBaseBlob):hqBlobs[p],mode:()=> '100644',content:(r,p)=>{assert.equal(p,hqAssetPath);return assets+(r===head?hqAssetSuffix:'');}};}
test('HQ accepts exact original three code paths and sole GP asset suffix',()=>{const f=hqFixture(),proof=verifyGpMemberFrontendFacts(f);assert.equal(proof.source,hqSource);assert.deepEqual(proof.paths,[...Object.keys(hqBlobs),hqAssetPath].sort());assert.equal(proof.assetAllowlist.blob,hqAssetBlob);});
test('HQ rejects changed original frontend',()=>{const f=hqFixture(),blob=f.blob;f.blob=(r,p)=>r===hqSource&&p==='hq.js'?'changed':blob(r,p);assert.throws(()=>verifyGpMemberFrontendFacts(f),/Original HQ/);});
test('HQ rejects unrelated frontend edits and holds configuration',()=>{const f=hqFixture(),diff=f.diff;f.diff=()=>[...diff(),'wrangler.toml'];assert.throws(()=>verifyGpMemberFrontendFacts(f),/four HQ/);});
test('HQ rejects omission of the script asset packaging change',()=>{const f=hqFixture();f.diff=()=>Object.keys(hqBlobs);assert.throws(()=>verifyGpMemberFrontendFacts(f),/four HQ/);});
test('HQ rejects an unchanged asset allowlist at the new source',()=>{const f=hqFixture(),blob=f.blob;f.blob=(r,p)=>r===head&&p===hqAssetPath?hqAssetBaseBlob:blob(r,p);assert.throws(()=>verifyGpMemberFrontendFacts(f),/Actual HQ GP asset allowlist drift/);});
test('HQ rejects foreign asset allowlist changes',()=>{const f=hqFixture(),blob=f.blob;f.blob=(r,p)=>r===head&&p===hqAssetPath?'foreign':blob(r,p);assert.throws(()=>verifyGpMemberFrontendFacts(f),/asset allowlist drift/);});
test('HQ rejects foreign allowlist bytes even behind a claimed approved blob',()=>{const f=hqFixture(),content=f.content;f.content=(r,p)=>content(r,p)+(r===head?'!unapproved.js\n':'');assert.throws(()=>verifyGpMemberFrontendFacts(f),/exact GP script asset allowlist suffix/);});
test('HQ rejects omission of the exact suffix behind a claimed approved blob',()=>{const f=hqFixture(),content=f.content;f.content=(r,p)=>content(r,p).replace(hqAssetSuffix,'');assert.throws(()=>verifyGpMemberFrontendFacts(f),/exact GP script asset allowlist suffix/);});
test('HQ rejects altered original asset allowlist provenance',()=>{const f=hqFixture(),blob=f.blob;f.blob=(r,p)=>r===hqSource&&p===hqAssetPath?'changed':blob(r,p);assert.throws(()=>verifyGpMemberFrontendFacts(f),/Original HQ asset allowlist drift/);});
for(const ref of [hqSource,head])test('HQ rejects exact code bytes with a changed source mode at '+ref,()=>{const f=hqFixture();f.mode=(r,p)=>r===ref&&p==='gp-directory.js'?'120000':'100644';assert.throws(()=>verifyGpMemberFrontendFacts(f),/file mode/);});
for(const ref of [hqBase,hqSource,head])test('HQ rejects asset allowlist mode drift at '+ref,()=>{const f=hqFixture();f.mode=(r,p)=>r===ref&&p===hqAssetPath?'100755':'100644';assert.throws(()=>verifyGpMemberFrontendFacts(f),/allowlist mode/);});
test('native boundary reader exposes protected deletions hidden by rename detection',()=>{
 const dir=mkdtempSync(join(tmpdir(),'gp-rename-boundary-'));
 const git=(...a)=>execFileSync('/usr/bin/git',['-C',dir,...a],{encoding:'utf8'}).trim();
 try{
  git('init','--quiet');git('config','diff.renames','true');
  writeFileSync(join(dir,'unrelated-protected.mjs'),'// Synthetic local rename gate fixture\n'.repeat(40));
  git('add','--','unrelated-protected.mjs');git('-c','user.name=GP gate fixture','-c','user.email=fixture@example.invalid','commit','--quiet','-m','Synthetic baseline');const a=git('rev-parse','HEAD');
  renameSync(join(dir,'unrelated-protected.mjs'),join(dir,'allowed-gp.mjs'));git('add','--all');git('-c','user.name=GP gate fixture','-c','user.email=fixture@example.invalid','commit','--quiet','-m','Synthetic rename');const b=git('rev-parse','HEAD');
  assert.equal(git('diff','--name-only',a,b),'allowed-gp.mjs');
  assert.deepEqual(gpMemberCodeChangedPaths(dir,a,b),['allowed-gp.mjs','unrelated-protected.mjs']);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
for(const flag of ['assume-unchanged','skip-worktree'])test('native source cleanliness rejects '+flag+' hiding modified compiled source',()=>{
 const dir=mkdtempSync(join(tmpdir(),'gp-hidden-working-source-'));
 const git=(...a)=>execFileSync('/usr/bin/git',['-C',dir,...a],{encoding:'utf8'}).trim();
 try{
  git('init','--quiet');writeFileSync(join(dir,'tracked.mjs'),'// Synthetic frozen working-source fixture\n');git('add','--','tracked.mjs');
  git('-c','user.name=GP gate fixture','-c','user.email=fixture@example.invalid','commit','--quiet','-m','Synthetic clean baseline');
  gpMemberCodeCleanSource(dir);git('update-index','--'+flag,'tracked.mjs');writeFileSync(join(dir,'tracked.mjs'),'// Synthetic hidden mutation\n');
  assert.equal(git('diff','--name-only','HEAD','--'),'');
  assert.throws(()=>gpMemberCodeCleanSource(dir),/index flags are forbidden/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('native source admission ignores poisoned Git environment and PATH',{skip:!existsSync(recordPath)},()=>{
 const prior={...process.env},dir=mkdtempSync(join(tmpdir(),'gp-native-path-'));
 try{
  const fake=join(dir,'git');writeFileSync(fake,'#!/bin/sh\nexit 99\n');chmodSync(fake,0o700);
  process.env.PATH=dir;process.env.GIT_DIR=join(dir,'missing');process.env.GIT_WORK_TREE=dir;
  process.env.GIT_OBJECT_DIRECTORY=join(dir,'objects');process.env.GIT_CONFIG_COUNT='1';
  process.env.GIT_CONFIG_KEY_0='core.repositoryformatversion';process.env.GIT_CONFIG_VALUE_0='-1';
  assert.equal(verifyGpMemberCodeAdmission().originalSource,source);
 }finally{for(const k of Object.keys(process.env))if(!(k in prior))delete process.env[k];Object.assign(process.env,prior);rmSync(dir,{recursive:true,force:true});}
});
