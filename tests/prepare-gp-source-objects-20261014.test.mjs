import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {copyFileSync,existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {GP_SOURCE_PACKETS as packets,GP_SOURCE_BUNDLE_DIRECTORY as bundles,verifyGpSourceBundleBytes,verifyGpSourceObjectPins,gpSourcePreparationState,assertGpSourcePreparationState,prepareGpSourceObjects} from '../release/prepare-gp-source-objects-20261014.mjs';
import {verifyGpMemberCodeAdmission,verifyGpMemberFrontendAdmission} from '../release/gp-member-code-admission-20261014.mjs';
const env=()=>Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('GIT_')));
const git=(repo,...args)=>execFileSync('/usr/bin/git',['--no-replace-objects','-c','core.hooksPath=/dev/null','-C',repo,...args],{env:env(),encoding:'utf8',maxBuffer:64e6}).trim();
const bytes=spec=>readFileSync(join(bundles,spec.file));
const rehash=(spec,value)=>({...spec,bytes:value.length,sha256:createHash('sha256').update(value).digest('hex'),blob:createHash('sha1').update('blob '+value.length+'\0').update(value).digest('hex')});
for(const[kind,spec]of Object.entries(packets))test('literal tracked '+kind+' bundle pins are exact',()=>assert.equal(verifyGpSourceBundleBytes(bytes(spec),spec),spec));
test('corrupt and truncated binary packets are rejected',()=>{const spec=packets.core,changed=Buffer.from(bytes(spec));changed[changed.length-1]^=1;assert.throws(()=>verifyGpSourceBundleBytes(changed,spec),/SHA-256/);assert.throws(()=>verifyGpSourceBundleBytes(changed.subarray(1),spec),/length/);});
test('wrong prerequisite or advertised source remains rejected after byte checks',()=>{const spec=packets.core,raw=bytes(spec).toString('latin1');for(const pin of[spec.base,spec.head]){const changed=Buffer.from(raw.replace(pin,'f'.repeat(40)),'latin1');assert.throws(()=>verifyGpSourceBundleBytes(changed,rehash(spec,changed)),/base prerequisite|source head/);}});
test('state comparison rejects HEAD, symref, reference and index changes',()=>{const before={head:'a',symbolicHead:'refs/heads/main',headFile:'h',refs:'refs/heads/main\0a\0',index:{path:'/synthetic/index',exists:true,sha256:'i'}};for(const change of[{head:'b'},{symbolicHead:'refs/heads/other'},{headFile:'other'},{refs:'refs/heads/main\0b\0'},{index:{path:'/synthetic/index',exists:true,sha256:'changed'}}])assert.throws(()=>assertGpSourcePreparationState(before,{...before,...change}),/changed HEAD, references or index/);});
test('source preparation requires explicit repositories and keeps HQ packaging separate',()=>{assert.throws(()=>prepareGpSourceObjects(),/actual core or HQ repository/);assert.throws(()=>prepareGpSourceObjects({coreRepository:process.cwd(),includeHqPackaging:true}),/actual HQ repository/);});
const hqSource=process.env.SHIFT_GP_HQ_SOURCE_REPOSITORY;
test('explicit cold source hydration is idempotent and preserves actual repository state',{skip:!hqSource},()=>{
 const root=mkdtempSync(join(tmpdir(),'gp-cold-object-preparation-')),core=join(root,'core'),hq=join(root,'hq');
 try{
  for(const[repo,source]of[[core,process.cwd()],[hq,hqSource]]){mkdirSync(repo);git(repo,'init','--quiet');const sourceHead=git(source,'rev-parse','HEAD');git(repo,'fetch','--quiet','--no-tags','--no-write-fetch-head',source,sourceHead);git(repo,'checkout','--quiet','--detach',sourceHead);}
  for(const[repo,spec]of[[core,packets.core],[core,packets.savedProfile],[hq,packets.hq]])assert.throws(()=>verifyGpSourceObjectPins(repo,spec),/Git failed/);
  assert.throws(()=>verifyGpMemberCodeAdmission(core));assert.throws(()=>verifyGpMemberFrontendAdmission(hq));
  const states=[gpSourcePreparationState(core),gpSourcePreparationState(hq)],prior={...process.env};
  try{
   process.env.GIT_DIR=join(root,'wrong');process.env.GIT_OBJECT_DIRECTORY=join(root,'wrong-objects');process.env.GIT_CONFIG_COUNT='1';process.env.GIT_CONFIG_KEY_0='core.repositoryformatversion';process.env.GIT_CONFIG_VALUE_0='-1';process.env.PATH='/nonexistent';
   for(let n=0;n<2;n++){const coreProof=prepareGpSourceObjects({coreRepository:core}),hqProof=prepareGpSourceObjects({hqRepository:hq,includeHqPackaging:true});assert.deepEqual(coreProof.packets.map(p=>p.kind),['core','savedProfile']);assert.deepEqual(hqProof.packets.map(p=>p.kind),['hq','hqPackaging']);assert.equal(coreProof.refsChanged,false);assert.equal(hqProof.refsChanged,false);}
  }finally{for(const key of Object.keys(process.env))if(!(key in prior))delete process.env[key];Object.assign(process.env,prior);}
  for(const[repo,spec]of[[core,packets.core],[core,packets.savedProfile],[hq,packets.hq],[hq,packets.hqPackaging]])verifyGpSourceObjectPins(repo,spec);
  verifyGpMemberCodeAdmission(core);verifyGpMemberFrontendAdmission(hq);
  assertGpSourcePreparationState(states[0],gpSourcePreparationState(core));assertGpSourcePreparationState(states[1],gpSourcePreparationState(hq));
  assert.throws(()=>verifyGpSourceObjectPins(core,{...packets.core,baseTree:'0'.repeat(40)}),/source tree/);assert.throws(()=>verifyGpSourceObjectPins(hq,{...packets.hq,tree:'0'.repeat(40)}),/source tree/);
  const bad=join(root,'bad-packets');mkdirSync(bad);for(const spec of Object.values(packets))copyFileSync(join(bundles,spec.file),join(bad,spec.file));const damaged=bytes(packets.core);damaged[damaged.length-1]^=1;writeFileSync(join(bad,packets.core.file),damaged);
  assert.throws(()=>prepareGpSourceObjects({coreRepository:core,hqRepository:hq,bundleDirectory:bad}),/SHA-256/);assertGpSourcePreparationState(states[0],gpSourcePreparationState(core));assertGpSourcePreparationState(states[1],gpSourcePreparationState(hq));
  const empty=join(root,'empty');mkdirSync(empty);git(empty,'init','--quiet');const emptyBefore=gpSourcePreparationState(empty);assert.throws(()=>prepareGpSourceObjects({coreRepository:empty}),/Git failed/);assertGpSourcePreparationState(emptyBefore,gpSourcePreparationState(empty));
  const hqBase=join(root,'hq-base');mkdirSync(hqBase);git(hqBase,'init','--quiet');git(hqBase,'fetch','--quiet','--no-tags','--no-write-fetch-head',hqSource,packets.hq.base);git(hqBase,'checkout','--quiet','--detach',packets.hq.base);const baseState=gpSourcePreparationState(hqBase);assert.throws(()=>verifyGpSourceObjectPins(hqBase,packets.hqPackaging),/Git failed/);prepareGpSourceObjects({hqRepository:hqBase,includeHqPackaging:true});verifyGpSourceObjectPins(hqBase,packets.hqPackaging);assertGpSourcePreparationState(baseState,gpSourcePreparationState(hqBase));
  git(core,'config','remote.fixture.promisor','true');assert.throws(()=>gpSourcePreparationState(core),/non-promisor repository/);git(core,'config','--unset','remote.fixture.promisor');
  git(core,'config','core.splitIndex','true');git(core,'update-index','--split-index');assert.throws(()=>gpSourcePreparationState(core),/split indexes/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
