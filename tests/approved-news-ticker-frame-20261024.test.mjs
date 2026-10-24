import test from 'node:test';import assert from 'node:assert/strict';
import{execFileSync}from'node:child_process';
import{approvedNewsTickerOuterFrame,withApprovedTickerPredecessor,approvedTickerPredecessorHead}from'../release/approved-news-ticker-frame-20261024.mjs';
const g=(...a)=>execFileSync('/usr/bin/git',a,{encoding:'utf8',maxBuffer:64e6}).trimEnd();
test('finite approvedTicker source admission retains actual native identity and every prior receipt',()=>{
 const f=approvedNewsTickerOuterFrame();assert(f);assert.equal(f.rawHead,g('rev-parse','HEAD'));assert.notEqual(f.base,f.rawHead);
 const ledger='release/approved-runtime-composition.json',current=JSON.parse(g('show','HEAD:'+ledger)),prior=JSON.parse(g('show',f.base+':'+ledger));delete current.approvedNewsTicker20261024;assert.deepEqual(current,prior);
 assert.equal(approvedTickerPredecessorHead(),null);withApprovedTickerPredecessor(f,()=>assert.equal(approvedTickerPredecessorHead(),f.base));assert.equal(approvedTickerPredecessorHead(),null);
 assert.throws(()=>withApprovedTickerPredecessor({...f},()=>{}),/Independent/);
});
test('finite approvedTicker callbacks authenticate actual file and directory aliases before historical projection',()=>{
 const f=approvedNewsTickerOuterFrame();
 for(const p of ['medicines-watch/industry.mjs','radar-news-pages-v1.js','release','release/approved-runtime-composition.json']){
  let forged=false,calls=0;const read=(r,p)=>{calls++;return forged&&(r==='HEAD'||r===f.rawHead)?'forged':g('rev-parse',r+':'+p)};
  const projected=f.projectRead(read);assert.equal(projected('HEAD',p),g('rev-parse',f.base+':'+p));assert(calls>=3);forged=true;assert.throws(()=>projected('HEAD',p),{name:'AssertionError',code:'ERR_ASSERTION',message:'unauthentic supplied approvedTicker source: HEAD:'+p});
 }
});
test('finite approvedTicker never accepts a forged native diff or ancestry callback',()=>{
 const f=approvedNewsTickerOuterFrame();assert.throws(()=>f.projectDiff(()=>[])(f.base,'HEAD'),/diff/);assert.throws(()=>f.projectAncestor(()=>false)(f.base,'HEAD'),/ancestry/);
});

import{websiteEditorialCompletionHistoricalView}from'../release/website-editorial-scope-20261018.mjs';
test('both current native aliases retain the same admitted historical content and reader calls',()=>{const f=approvedNewsTickerOuterFrame(),v=websiteEditorialCompletionHistoricalView(),p='medicines-watch/industry.mjs';assert.equal(v.read(f.rawHead,p),v.read('HEAD',p));assert.equal(v.content(f.rawHead,p),v.content('HEAD',p));assert.equal(v.projectRead((r,p)=>g('rev-parse',r+':'+p))(f.rawHead,p),v.read('HEAD',p));assert.deepEqual(v.diff(v.head,f.rawHead),v.diff(v.head,'HEAD'));});

import {verifyHealthVisionExtension} from '../release/health-vision-scope-20261021.mjs';
import {verifyTestosteroneExtension} from '../release/testosterone-scope-20261021.mjs';
test('Health and TRT preserve their actual current native HEAD after exact ticker qualification',()=>{for(const verify of [verifyHealthVisionExtension,verifyTestosteroneExtension]){const proof=verify();assert.equal(proof.actual,g('rev-parse','HEAD'));assert.equal(proof.productionVerified,false);}});

test('original ledger fixture restoration is exact and rejects any forged current bytes',()=>{const f=approvedNewsTickerOuterFrame(),raw=g('show','HEAD:release/approved-runtime-composition.json');assert.equal(approvedTickerOriginalLedger(raw),g('show',f.base+':release/approved-runtime-composition.json'));assert.throws(()=>approvedTickerOriginalLedger(raw+' '));assert.equal(approvedTickerOriginalFixtureHead(),f.base);});
import {approvedTickerOriginalLedger,approvedTickerOriginalFixtureHead} from '../release/approved-news-ticker-frame-20261024.mjs';

import {verifyMemberRecordingRepair} from '../release/member-recording-repair-20261024.mjs';
import {approvedTickerOriginalWorkingBytes} from '../release/approved-news-ticker-frame-20261024.mjs';
test('member native repair rejects any unqualified tail and retains its actual current source after exact ticker admission',()=>{const f=approvedNewsTickerOuterFrame(),proof=verifyMemberRecordingRepair();assert.equal(proof.head,g('rev-parse','HEAD'));assert.equal(proof.paths.length,20);const path='release/member-recording-repair-20261024.mjs',raw=Buffer.from(g('show','HEAD:'+path)+'\n');assert.throws(()=>approvedTickerOriginalWorkingBytes(path,raw));withApprovedTickerPredecessor(f,()=>{assert.equal(approvedTickerOriginalWorkingBytes(path,raw).toString().trimEnd(),g('show',f.base+':'+path));assert.throws(()=>approvedTickerOriginalWorkingBytes(path,Buffer.concat([raw,Buffer.from('forged')])));});});

import {approvedTickerComparisonValue} from '../release/approved-news-ticker-frame-20261024.mjs';
test('exact current admission maps only native approved changed pins and preserves foreign values and heads',()=>{const f=approvedNewsTickerOuterFrame(),path='release/health-vision-scope-20261021.mjs',pin=g('rev-parse','HEAD:'+path),old=g('rev-parse',f.base+':'+path);assert.notEqual(pin,old);assert.equal(approvedTickerComparisonValue(path,pin,f.rawHead),old);assert.equal(approvedTickerComparisonValue(path,pin+'forged',f.rawHead),pin+'forged');assert.equal(approvedTickerComparisonValue(path,pin,f.base),pin);});

import {readFileSync,writeFileSync} from 'node:fs';
test('nested admission reuses only the private synchronous frame and never an unscoped verdict',()=>{const f=approvedNewsTickerOuterFrame();withApprovedTickerPredecessor(f,()=>{assert.equal(approvedNewsTickerOuterFrame(),f);withApprovedTickerPredecessor(f,()=>assert.equal(approvedNewsTickerOuterFrame(),f));});assert.equal(approvedTickerPredecessorHead(),null);assert.notEqual(approvedNewsTickerOuterFrame(),f);});
test('nested reuse retains callback authentication and clears the private context on refusal',()=>{const f=approvedNewsTickerOuterFrame();withApprovedTickerPredecessor(f,()=>{const reused=approvedNewsTickerOuterFrame();assert.throws(()=>reused.projectRead(()=> 'forged')('HEAD','radar-published-ticker-v1.js'),/unauthentic/);});assert.throws(()=>withApprovedTickerPredecessor(f,()=>Promise.resolve(1)),/synchronous/);assert.equal(approvedTickerPredecessorHead(),null);});
test('nested reuse rejects real working-source mutation through the original fresh guard',()=>{const f=approvedNewsTickerOuterFrame(),path='radar-published-ticker-v1.js',before=readFileSync(path);try{assert.throws(()=>withApprovedTickerPredecessor(f,()=>{writeFileSync(path,Buffer.concat([before,Buffer.from('\n// unapproved mutation\n')]));assert.throws(()=>approvedNewsTickerOuterFrame());throw Error('changed source must invalidate outer return');}));}finally{writeFileSync(path,before);}assert.equal(approvedTickerPredecessorHead(),null);assert(approvedNewsTickerOuterFrame());});

import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {realpathSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
function isolatedTickerProbe(script){const directory=realpathSync(mkdtempSync(tmpdir()+'/ticker-storage-proof-'));try{execFileSync('/usr/bin/git',['clone','--quiet','--no-hardlinks',process.cwd(),directory+'/checkout'],{stdio:'pipe'});const result=spawnSync(process.execPath,['--input-type=module','-e',script],{cwd:directory+'/checkout',encoding:'utf8',timeout:120000});assert.equal(result.status,0,result.stdout+'\n'+result.stderr);}finally{rmSync(directory,{recursive:true,force:true});}}
test('nested construction rejects disappearance of a required historical Git object',()=>isolatedTickerProbe("import{approvedNewsTickerOuterFrame,withApprovedTickerPredecessor}from'./release/approved-news-ticker-frame-20261024.mjs';import{existsSync,renameSync}from'node:fs';import assert from'node:assert/strict';const f=approvedNewsTickerOuterFrame(),loose='.git/objects/'+f.base.slice(0,2)+'/'+f.base.slice(2),path=existsSync(loose)?loose:'.git/objects/pack',park=path+'.park';withApprovedTickerPredecessor(f,()=>{renameSync(path,park);try{assert.throws(()=>approvedNewsTickerOuterFrame());}finally{renameSync(park,path)}});"));
test('changed unrelated ref namespace falls back to the complete original constructor',()=>isolatedTickerProbe("import{approvedNewsTickerOuterFrame,withApprovedTickerPredecessor}from'./release/approved-news-ticker-frame-20261024.mjs';import{execFileSync}from'node:child_process';import assert from'node:assert/strict';const f=approvedNewsTickerOuterFrame(),ref='refs/tags/ticker-storage-proof';withApprovedTickerPredecessor(f,()=>{execFileSync('/usr/bin/git',['update-ref',ref,f.rawHead]);try{const fresh=approvedNewsTickerOuterFrame();assert.notEqual(fresh,f);assert.equal(fresh.rawHead,f.rawHead);}finally{execFileSync('/usr/bin/git',['update-ref','-d',ref]);}});"));
test('the bounded provenance repair retains every original ticker registration field',()=>{const raw=JSON.parse(g('show','HEAD:release/approved-runtime-composition.json')).approvedNewsTicker20261024,{repairBase,repairPaths,repairSource,...before}=raw;assert.equal(repairBase,'07850862f8d4cf56a4d73473c6320a33c64b624e');assert.deepEqual(repairPaths,['release/approved-news-ticker-frame-20261024.mjs','tests/approved-news-ticker-frame-20261024.test.mjs']);assert.match(repairSource,/^[a-f0-9]{40}$/);assert.deepEqual(before,JSON.parse(g('show',repairBase+':release/approved-runtime-composition.json')).approvedNewsTicker20261024);});
