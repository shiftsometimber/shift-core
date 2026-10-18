import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,chmodSync} from 'node:fs';
import {verifyGrubRankingSource} from '../release/grub-ranking-source-20261018.mjs';
const git=(...args)=>execFileSync('/usr/bin/git',['--no-replace-objects',...args],{encoding:'utf8',maxBuffer:64e6}).trim();
const record=()=>JSON.parse(readFileSync('release/approved-runtime-composition.json','utf8')).grubRanking20261018;
const path='member-experience/grub-intelligence.mjs';
function unchanged(){assert.equal(git('status','--porcelain','--untracked-files=no'),'');}
test('Grub admits only exact finite source and inverse restores complete actual serving tree',()=>{
 const c=record();assert.equal(verifyGrubRankingSource(c),c);assert.equal(c.base,'0a11149ac773223b95e149d5ef975a9880cd677d');assert.equal(c.baseTree,'122e06703560c7168e1f5a7b36f11fb2fe0af95a');assert.equal(c.configurationChanged,false);unchanged();
});
test('Grub refuses caller source/diff/ancestry readers, alternative heads and historical projection',()=>{
 const c=record();for(const options of [{head:c.base},{read:()=>''},{readContent:()=>''},{readDiff:()=>[]},{isAncestor:()=>true},null])assert.throws(()=>verifyGrubRankingSource(c,options));unchanged();
});
test('Grub refuses changed approval, path set, donor, baseline or held boundary',()=>{
 const c=record();for(const mutate of [r=>r.source='0'.repeat(40),r=>r.paths=r.paths.slice(1),r=>r.stockChanged=true,r=>r.clinicalChanged=true,r=>r.acceptedBaseline.workers.core.versionId='0'.repeat(36),r=>r.acceptedBaseline.coordinatingMain='0'.repeat(40)]){const r=structuredClone(c);mutate(r);assert.throws(()=>verifyGrubRankingSource(r));}unchanged();
});
test('Grub refuses dirty tracked bytes, staged source and executable source',()=>{
 const c=record(),before=readFileSync(path);try{writeFileSync(path,Buffer.concat([before,Buffer.from('\n// owned negative\n')]));assert.throws(()=>verifyGrubRankingSource(c));git('add','--',path);assert.throws(()=>verifyGrubRankingSource(c));}finally{git('reset','HEAD','--',path);writeFileSync(path,before);chmodSync(path,0o644);}
 try{chmodSync(path,0o755);assert.throws(()=>verifyGrubRankingSource(c));}finally{chmodSync(path,0o644);}unchanged();
});
test('Grub refuses hidden index flags and injected Git selectors',()=>{
 const c=record();for(const flag of ['assume-unchanged','skip-worktree']){try{git('update-index','--'+flag,'--',path);assert.throws(()=>verifyGrubRankingSource(c));}finally{git('update-index','--no-'+flag,'--',path);}}
 const name='GIT_INDEX_FILE',before=process.env[name];try{process.env[name]='/tmp/grub-untrusted-index';assert.throws(()=>verifyGrubRankingSource(c));}finally{if(before===undefined)delete process.env[name];else process.env[name]=before;}unchanged();
});
test('Grub refuses a substituted native assertion and never invokes data accessors',()=>{
 const c=record(),equal=assert.equal;try{assert.equal=()=>{};let raised=false;try{verifyGrubRankingSource(c);}catch{raised=true;}equal(raised,true);}finally{assert.equal=equal;}
 let reached=false;const forged={...c};Object.defineProperty(forged,'stockChanged',{enumerable:true,get(){reached=true;return false;}});assert.throws(()=>verifyGrubRankingSource(forged));assert.equal(reached,false);unchanged();
});
