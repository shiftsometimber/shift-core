import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,chmodSync} from 'node:fs';
import {verifyGrubEverydaySource} from '../release/grub-everyday-source-20261017.mjs';
const git=(...args)=>execFileSync('/usr/bin/git',['--no-replace-objects',...args],{encoding:'utf8',maxBuffer:64e6}).trim();
const record=()=>JSON.parse(readFileSync('release/approved-runtime-composition.json','utf8')).grubEverydayDirect20261017;
const path='member-experience/grub-intelligence.mjs';
function unchanged(){assert.equal(git('status','--porcelain','--untracked-files=no'),'');}
test('Grub admits only exact finite source and inverse restores complete actual serving tree',()=>{
 const c=record();assert.equal(verifyGrubEverydaySource(c),c);assert.equal(c.base,'b6f9c0c36d4303e5d384fb2d62b58968b998aa64');assert.equal(c.baseTree,'00781ce728ca816ddab27022c7bcf8f9e1f13b13');assert.equal(c.configurationChanged,false);unchanged();
});
test('Grub refuses caller source/diff/ancestry readers, alternative heads and historical projection',()=>{
 const c=record();for(const options of [{head:c.base},{read:()=>''},{readContent:()=>''},{readDiff:()=>[]},{isAncestor:()=>true},null])assert.throws(()=>verifyGrubEverydaySource(c,options));unchanged();
});
test('Grub refuses changed approval, path set, donor, baseline or held boundary',()=>{
 const c=record();for(const mutate of [r=>r.source='0'.repeat(40),r=>r.paths=r.paths.slice(1),r=>r.stockChanged=true,r=>r.clinicalChanged=true,r=>r.acceptedBaseline.workers.core.versionId='0'.repeat(36),r=>r.acceptedBaseline.coordinatingMain='0'.repeat(40)]){const r=structuredClone(c);mutate(r);assert.throws(()=>verifyGrubEverydaySource(r));}unchanged();
});
test('Grub refuses dirty tracked bytes, staged source and executable source',()=>{
 const c=record(),before=readFileSync(path);try{writeFileSync(path,Buffer.concat([before,Buffer.from('\n// owned negative\n')]));assert.throws(()=>verifyGrubEverydaySource(c));git('add','--',path);assert.throws(()=>verifyGrubEverydaySource(c));}finally{git('reset','HEAD','--',path);writeFileSync(path,before);chmodSync(path,0o644);}
 try{chmodSync(path,0o755);assert.throws(()=>verifyGrubEverydaySource(c));}finally{chmodSync(path,0o644);}unchanged();
});
test('Grub refuses hidden index flags and injected Git selectors',()=>{
 const c=record();for(const flag of ['assume-unchanged','skip-worktree']){try{git('update-index','--'+flag,'--',path);assert.throws(()=>verifyGrubEverydaySource(c));}finally{git('update-index','--no-'+flag,'--',path);}}
 const name='GIT_INDEX_FILE',before=process.env[name];try{process.env[name]='/tmp/grub-untrusted-index';assert.throws(()=>verifyGrubEverydaySource(c));}finally{if(before===undefined)delete process.env[name];else process.env[name]=before;}unchanged();
});
test('Grub refuses a substituted native assertion and never invokes data accessors',()=>{
 const c=record(),equal=assert.equal;try{assert.equal=()=>{};let raised=false;try{verifyGrubEverydaySource(c);}catch{raised=true;}equal(raised,true);}finally{assert.equal=equal;}
 let reached=false;const forged={...c};Object.defineProperty(forged,'stockChanged',{enumerable:true,get(){reached=true;return false;}});assert.throws(()=>verifyGrubEverydaySource(forged));assert.equal(reached,false);unchanged();
});
