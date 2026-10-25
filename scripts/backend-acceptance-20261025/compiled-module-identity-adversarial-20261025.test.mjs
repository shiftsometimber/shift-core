import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {APPROVED_COMPILED_MODULE_PATHS,indexCompiledSections,verifyApprovedCompiledModules} from './compiled-module-identity-20261025.mjs';
const candidate=fs.readFileSync('/Users/shiftsometimberltd/SST/backend-consolidated-build-20261024/bundle-current/worker.js','utf8');
const physical=fs.readFileSync('/Users/shiftsometimberltd/SST/core-foundayo-baseline-recovery-20261025/bundle-foundayo-qualification/worker.js','utf8');
assert.equal(createHash('sha256').update(candidate).digest('hex'),'5e0a543df9348fe3f1a922c36a673e10f24e05ee2264d5e33e6038030ec47a37');
const view=indexCompiledSections(candidate);
const section=(path,n)=>view.byPath.get(path)[n];
const replaceSection=(path,n,fn)=>{const part=section(path,n),at=candidate.indexOf(part);assert(at>=0);return candidate.slice(0,at)+fn(part)+candidate.slice(at+part.length);};
test('fresh current physical-dependency compilation matches all20 logical modules and26 exact raw sections',()=>{
 const proof=verifyApprovedCompiledModules(physical,candidate);assert.equal(Object.keys(proof).length,20);assert.equal(Object.values(proof).reduce((n,x)=>n+x.segments,0),26);assert.equal(proof['shift-coach/worker.mjs'].segments,3);assert.equal(proof['worker-entry-v6.js'].segments,5);
});
test('tampering a later coaching section is rejected',()=>assert.throws(()=>verifyApprovedCompiledModules(replaceSection('shift-coach/worker.mjs',1,s=>s.replace('\n','\nvoid 0;\n')),candidate),/implementation differs/));
test('tampering the final entrypoint section is rejected',()=>assert.throws(()=>verifyApprovedCompiledModules(replaceSection('worker-entry-v6.js',4,s=>s.replace('\n','\nvoid 0;\n')),candidate),/implementation differs/));
test('missing repeated sections are rejected',()=>assert.throws(()=>verifyApprovedCompiledModules(replaceSection('shift-coach/worker.mjs',1,()=>''),candidate),/section identity/));
test('even an identical extra section is rejected',()=>assert.throws(()=>verifyApprovedCompiledModules(candidate+section('worker-entry-v6.js',0),candidate),/section identity/));
test('unique auth-module tampering is rejected',()=>assert.throws(()=>verifyApprovedCompiledModules(replaceSection('auth-recovery-v1.js',0,s=>s.replace('\n','\nvoid 0;\n')),candidate),/implementation differs/));
test('moving intact selected modules is rejected',()=>{
 const markers=[...candidate.matchAll(/^\/\/ ([a-zA-Z0-9_./@+-]+\.(?:js|mjs|json))\n/gm)];
 const selected=new Set(APPROVED_COMPILED_MODULE_PATHS);const choices=markers.map((m,i)=>({path:m[1],start:m.index,end:markers[i+1]?.index??candidate.length})).filter(x=>selected.has(x.path));
 const a=choices[0],b=choices.find(x=>x.path!==a.path);assert(a&&b&&a.end<=b.start);const moved=candidate.slice(0,a.start)+candidate.slice(b.start,b.end)+candidate.slice(a.end,b.start)+candidate.slice(a.start,a.end)+candidate.slice(b.end);
 assert.throws(()=>verifyApprovedCompiledModules(moved,candidate),/execution order/);
});
